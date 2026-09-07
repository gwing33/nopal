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
from step 3 until step 7 completes — usually well under a minute given the
current dataset size). Do not run this unattended — confirm each step
before proceeding to the next. `db/compact.sh` automates the safe half
(step 1); everything from step 3 onward touches the live volume and stays
a manual, attended procedure.

1. **Back up.** Fly already takes daily volume snapshots (5-day
   retention), but take an explicit export too — this pulls data through
   `fly proxy` onto your own machine, never touching the remote volume:

   ```sh
   make compact-db SURREAL_PASS=<prod-pass>
   ```

   This writes `db/backups/pre-compact-<timestamp>.surql` and sanity-checks
   its size. Confirm the reported size/record count looks right before
   continuing.

2. **Spot-check the export** — `less` the file, confirm it contains
   `DEFINE TABLE` statements and `INSERT`/`CREATE` data for the tables you
   expect.

3. **Stop the live machine** so nothing writes while you wipe the store:

   ```sh
   fly machine list --app db-thrumming-water-5938        # note the machine id
   fly machine stop <machine-id> --app db-thrumming-water-5938
   ```

4. **Attach a temporary machine to the same volume** to get raw filesystem
   access without SurrealDB running (and without touching `start.sh`,
   which would otherwise auto-boot SurrealDB against the still-full
   store). This reuses the already-deployed image, just with a shell
   instead of the normal entrypoint, and destroys itself on exit:

   ```sh
   fly machine run registry.fly.io/db-thrumming-water-5938:<current-tag> \
     --app db-thrumming-water-5938 \
     --volume data:/data \
     --shell --command /bin/sh
   ```

   (Get `<current-tag>` from `fly status --app db-thrumming-water-5938` —
   the `Image` field.) Once in the shell:

   ```sh
   du -sh /data/srdb.db   # sanity check — should match the size you saw before
   rm -rf /data/srdb.db
   exit                   # destroys this temporary machine, freeing the volume
   ```

5. **Restart the original machine:**

   ```sh
   fly machine start <machine-id> --app db-thrumming-water-5938
   ```

   `start.sh` boots against the now-empty volume, creates a fresh,
   compact `surrealkv` store, and re-runs migrations to recreate the
   schema. Wait for it to report healthy (`fly status`).

6. **Re-import the backup**, tunneling the same way `compact-db` does:

   ```sh
   fly proxy 8081:8080 --app db-thrumming-water-5938 &
   surreal import \
     --endpoint http://localhost:8081 \
     --username root --password <prod-pass> \
     --namespace nopal --database opuntia \
     db/backups/pre-compact-<timestamp>.surql
   ```

7. **Verify**, then confirm disk usage:

   ```sh
   fly ssh console --app db-thrumming-water-5938 -C "df -h /data"
   ```

   You should see `sstables` + a much smaller `vlog` — expect disk usage to
   drop close to the live-data size (a few MB, based on the current
   dataset).

## When to run this (scheduling)

Don't run this on a blind calendar cron, and don't automate the destructive
half (steps 3–6) unattended yet — a bug in an unattended wipe/reimport
script is a permanent-data-loss bug. Instead, treat it as **alert-triggered
maintenance**:

- The `start.sh` watchdog (added alongside this doc) pings
  `DISK_ALERT_WEBHOOK_URL` at 75%/90% `/data` usage. Treat the first
  WARNING as the signal to schedule a compaction in the next few days, not
  an emergency — the volume's `auto_extend_size_*` config in `fly.toml`
  is the actual emergency backstop.
- Practically, that means compaction cadence tracks write volume, not the
  calendar: a quiet month might need none; a month with a bulk
  import/backfill might need one right after.
- Run `make compact-db` (step 1, the safe export) any time, cheaply, just
  to see current record counts/export size — it doesn't touch the volume,
  so there's no harm in running it proactively to check.
- Once the full export→wipe→import cycle has been run by hand a few times
  and feels routine, it's reasonable to promote steps 3–6 to a
  `workflow_dispatch`-triggered (manually clicked, not scheduled) GitHub
  Actions job for convenience — but keep a human clicking "run" until then.

## Going forward

- Repeat this compaction as needed (see above) until SurrealDB ships
  automatic vlog GC for `surrealkv`. Track upstream progress at
  [surrealdb/surrealkv](https://github.com/surrealdb/surrealkv).
- The disk-usage watchdog in `start.sh` and the volume's auto-extend
  setting mean a forgotten compaction cycle will no longer cause an
  outage — it'll just mean paying for more disk than necessary until the
  next compaction.
- If vlog growth becomes fast enough that trigger-based compaction isn't
  enough, consider switching the backend to `rocksdb://` (which has more
  mature, automatic compaction) — this would also require an export/import
  migration.
