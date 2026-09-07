# Reclaiming disk space (SurrealKV compaction)

## What happened (Sept 2026 incident)

The `db-thrumming-water-5938` Fly volume filled up completely (1GB, 100%
used). Root cause:

```
/data/srdb.db/
  sstables/   5.2 MB   ← actual live data
  vlog/     890 MB   ← value log (mostly dead/stale values)
  wal/       64 MB
```

SurrealDB's `surrealkv` storage engine (used here via
`surrealkv:///data/srdb.db`) writes values to an append-only value log
(vlog) and does not automatically garbage-collect or compact it in the
version we're running (`3.2.4`). Every update or delete leaves the old
value behind in the vlog forever — only the live data actually reflected
in `sstables` is "real". This is a known characteristic of the engine (see
[surrealdb/surrealkv#ARCHITECTURE.md](https://github.com/surrealdb/surrealkv/blob/main/docs/ARCHITECTURE.md)
and community reports of unbounded vlog growth).

In our case, **over 99% of disk usage was reclaimable dead space**, not
real growth in the dataset.

## Immediate fix applied

- Volume extended from 1GB → 5GB (`fly volumes extend`), no downtime.
- `auto_extend_size_threshold` / `_increment` / `_limit` added to
  `db/fly.toml` so the volume grows itself before hitting 100% again
  (takes effect on next `fly deploy`).
- A disk-usage watchdog was added to `start.sh` that logs WARNING/CRITICAL
  messages (visible in `fly logs`) at 75%/90% usage, and can optionally
  ping a webhook — set the `DISK_ALERT_WEBHOOK_URL` secret to a
  Slack-compatible incoming webhook URL to enable that.

These buy time and prevent a hard outage, but they don't reclaim the
wasted space — only compaction does that.

## Reclaiming space: export → wipe → import

There is no in-place "compact now" command exposed by `surreal` for the
`surrealkv` backend at this version. The reliable way to reclaim space is
to dump all data out, wipe the on-disk store, and reload it — this
rebuilds the sstables/vlog from scratch with no dead data.

**This requires a short maintenance window** (the database is unavailable
between wipe and successful reimport). Do not run this unattended — verify
each step before proceeding to the next.

1. **Back up first.** Fly already takes daily volume snapshots (5-day
   retention), but take an explicit export too:

   ```sh
   fly ssh console --app db-thrumming-water-5938 -C \
     "/surreal export --endpoint http://localhost:8080 --username root --password <pass> --namespace nopal --database opuntia /data/backup-$(date +%Y%m%d).surql"
   ```

   Copy that file off the machine (`fly ssh sftp get` or similar) before
   continuing.

2. **Verify the export** — check the file is non-trivial in size and
   spot-check a few records.

3. **Stop the app** (`fly scale count 0 --app db-thrumming-water-5938`, or
   `fly machine stop <id>`) so nothing writes while you wipe the store.

4. **Wipe the data directory** via `fly ssh console`:

   ```sh
   rm -rf /data/srdb.db
   ```

5. **Restart the machine** (`fly scale count 1` / `fly machine start`).
   `start.sh` will boot a fresh, empty `surrealkv` store and run
   migrations, recreating the schema.

6. **Re-import the backup:**

   ```sh
   fly ssh console --app db-thrumming-water-5938 -C \
     "/surreal import --endpoint http://localhost:8080 --username root --password <pass> --namespace nopal --database opuntia /data/backup-YYYYMMDD.surql"
   ```

7. **Verify** row counts / spot-check data, then confirm disk usage:

   ```sh
   fly ssh console --app db-thrumming-water-5938 -C "df -h /data"
   ```

   You should see `sstables` + a much smaller `vlog` — expect disk usage to
   drop close to the live-data size (a few MB, based on the current
   dataset).

## Going forward

- Repeat this compaction periodically (e.g. monthly, or after any bulk
  import/backfill) until SurrealDB ships automatic vlog GC for
  `surrealkv`. Track upstream progress at
  [surrealdb/surrealkv](https://github.com/surrealdb/surrealkv).
- The disk-usage watchdog in `start.sh` and the volume's auto-extend
  setting mean a forgotten compaction cycle will no longer cause an
  outage — it'll just mean paying for more disk than necessary until the
  next compaction.
- If vlog growth becomes fast enough that monthly compaction isn't enough,
  consider switching the backend to `rocksdb://` (which has more mature,
  automatic compaction) — this would also require an export/import
  migration.
