#!/bin/sh
set -e

# =============================================================================
# start.sh — SurrealDB entrypoint for Fly.io
#
# 1. Starts SurrealDB in the background.
# 2. Starts a disk-space watchdog in the background (see below).
# 3. Polls localhost until it accepts connections (up to 30 s).
# 4. Runs migrate.sh against localhost.
# 5. Waits on the SurrealDB process, forwarding signals cleanly.
# =============================================================================

USER="${SURREAL_USER:-root}"
PASS="${SURREAL_PASS:-root}"

# ── Start SurrealDB in the background ─────────────────────────────────────────
printf 'Starting SurrealDB...\n'
/surreal start --bind "[::]:8080" "surrealkv:///data/srdb.db" &
DB_PID=$!

# ── Disk-space watchdog ────────────────────────────────────────────────────────
# SurrealDB's surrealkv engine doesn't compact its value log (vlog) on its
# own, so /data can silently fill up over weeks — even with auto-extend
# configured on the volume in fly.toml as a hard safety net. This loop logs a
# warning well before that limit is reached, and optionally pings a webhook
# so someone actually sees it. Set DISK_ALERT_WEBHOOK_URL as a Fly secret to
# enable pings (any Slack-compatible incoming webhook works):
#   fly secrets set DISK_ALERT_WEBHOOK_URL=https://hooks.slack.com/...
notify_disk_usage() {
  usage="$1"
  level="$2"
  if [ -n "${DISK_ALERT_WEBHOOK_URL:-}" ]; then
    curl -sf -m 5 -X POST -H 'Content-Type: application/json' \
      -d "{\"text\":\"[${FLY_APP_NAME:-db}] disk usage ${level}: /data is at ${usage}% capacity on $(hostname)\"}" \
      "${DISK_ALERT_WEBHOOK_URL}" >/dev/null 2>&1 || true
  fi
}

monitor_disk() {
  warn_threshold=75
  crit_threshold=90
  last_level=0
  iter=0
  while true; do
    sleep 300 # 5 minutes
    iter=$((iter + 1))
    usage=$(df -P /data 2>/dev/null | awk 'NR==2 { gsub("%","",$5); print $5 }')
    [ -z "${usage}" ] && continue

    if [ "${usage}" -ge "${crit_threshold}" ]; then
      level=2
    elif [ "${usage}" -ge "${warn_threshold}" ]; then
      level=1
    else
      level=0
    fi

    # Alert immediately on crossing a threshold, then remind every ~30 min
    # while still elevated so it can't get lost in the noise.
    if [ "${level}" -gt 0 ] && { [ "${level}" -ne "${last_level}" ] || [ $((iter % 6)) -eq 0 ]; }; then
      if [ "${level}" -eq 2 ]; then
        printf '[disk-monitor] CRITICAL: /data is at %s%% capacity\n' "${usage}" >&2
        notify_disk_usage "${usage}" "CRITICAL"
      else
        printf '[disk-monitor] WARNING: /data is at %s%% capacity\n' "${usage}"
        notify_disk_usage "${usage}" "WARNING"
      fi
    fi
    last_level=${level}
  done
}

monitor_disk &
MONITOR_PID=$!

# Forward SIGTERM / SIGINT to SurrealDB (and stop the watchdog) so Fly can
# shut the machine down cleanly.
trap 'kill "$DB_PID" "$MONITOR_PID" 2>/dev/null' TERM INT

# ── Wait for SurrealDB to be ready ────────────────────────────────────────────
printf 'Waiting for SurrealDB to be ready'
i=0
until curl -sf "http://localhost:8080/health" >/dev/null 2>&1; do

  # Bail if SurrealDB exited unexpectedly.
  if ! kill -0 "$DB_PID" 2>/dev/null; then
    printf '\nSurrealDB process exited unexpectedly.\n' >&2
    exit 1
  fi

  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    printf '\nSurrealDB did not become ready within 30 s.\n' >&2
    exit 1
  fi

  printf '.'
  sleep 1
done
printf ' ready\n\n'

# ── Run migrations ─────────────────────────────────────────────────────────────
# SURREAL_ENDPOINT overrides the .internal URL that migrate.sh would otherwise
# build from FLY_APP_NAME — so migrations run against this machine directly.
SURREAL_ENDPOINT="http://localhost:8080" /bin/sh /migrate.sh

# ── Hand off ──────────────────────────────────────────────────────────────────
printf '\nDatabase ready.\n'
wait "$DB_PID"
