#!/bin/sh
set -e

# =============================================================================
# compact.sh — Back up SurrealDB's live data, as step 1 of the compaction
# runbook in COMPACTION.md.
#
# This script only does the SAFE, non-destructive half of compaction: it
# tunnels to the prod database and exports everything to a timestamped file
# on YOUR machine, then verifies the export is non-trivial. It deliberately
# does NOT touch the remote volume — the wipe/reimport half stays a manual,
# attended procedure (see COMPACTION.md) until that path has been proven out
# by hand a few times.
#
# Usage (from repo root or db/):
#   sh db/compact.sh
#   SURREAL_PASS=yourprodpassword sh db/compact.sh
# =============================================================================

DB_APP="${DB_APP:-db-thrumming-water-5938}"
NS="${NS:-nopal}"
DB="${DB:-opuntia}"
SURREAL_USER="${SURREAL_USER:-root}"
PROXY_PORT="${PROXY_PORT:-8081}"

if [ -z "${SURREAL_PASS:-}" ]; then
  printf 'SURREAL_PASS is not set — export it or pass it inline:\n'
  printf '  SURREAL_PASS=yourprodpassword sh db/compact.sh\n'
  exit 1
fi

command -v surreal >/dev/null 2>&1 || {
  printf 'The surreal CLI is not installed locally. Install it first:\n'
  printf '  brew install surrealdb/tap/surreal\n'
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
mkdir -p "${BACKUP_DIR}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/pre-compact-${TIMESTAMP}.surql"

printf 'Opening tunnel to %s on localhost:%s...\n' "${DB_APP}" "${PROXY_PORT}"
fly proxy "${PROXY_PORT}:8080" -a "${DB_APP}" &
PROXY_PID=$!
trap 'kill "${PROXY_PID}" 2>/dev/null' EXIT INT TERM

for i in $(seq 1 30); do
  curl -sf -o /dev/null "http://localhost:${PROXY_PORT}/health" && break
  sleep 1
done
curl -sf -o /dev/null "http://localhost:${PROXY_PORT}/health" || {
  printf 'Tunnel never became ready — is the fly CLI logged in?\n' >&2
  exit 1
}

printf 'Exporting NS %s / DB %s to %s...\n' "${NS}" "${DB}" "${BACKUP_FILE}"
surreal export \
  --endpoint "http://localhost:${PROXY_PORT}" \
  --username "${SURREAL_USER}" \
  --password "${SURREAL_PASS}" \
  --namespace "${NS}" \
  --database "${DB}" \
  "${BACKUP_FILE}"

SIZE=$(wc -c <"${BACKUP_FILE}" | tr -d ' ')
RECORD_COUNT=$(grep -c '^INSERT\|^UPDATE\|CREATE ' "${BACKUP_FILE}" 2>/dev/null || true)

printf '\n✓  Export complete.\n'
printf '   File:    %s\n' "${BACKUP_FILE}"
printf '   Size:    %s bytes\n' "${SIZE}"
printf '   Records: ~%s (rough CREATE/INSERT/UPDATE line count)\n' "${RECORD_COUNT:-0}"

if [ "${SIZE}" -lt 100 ]; then
  printf '\n⚠️  That export looks suspiciously small. STOP — do not proceed\n'
  printf '    to the wipe step in COMPACTION.md until you understand why.\n' >&2
  exit 1
fi

printf '\nNext: follow the "Reclaiming space" steps in db/COMPACTION.md,\n'
printf 'using %s as your verified backup.\n' "${BACKUP_FILE}"
