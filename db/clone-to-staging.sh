#!/bin/sh
set -e

# =============================================================================
# clone-to-staging.sh — Refresh the `staging` SurrealDB database from a live
# export of prod (`opuntia`), both inside the SAME SurrealDB instance/NS.
#
# Unlike db/compact.sh + COMPACTION.md, this is safe to run unattended: it
# only ever wipes and rewrites the ISOLATED `staging` database, never
# `opuntia` (prod) or anything on the volume outside SurrealDB's own
# per-database storage. Run it whenever staging data has gone stale enough
# to matter — there's no need for a fixed schedule.
#
# Usage (from repo root or db/):
#   SURREAL_PASS=yourprodpassword sh db/clone-to-staging.sh
# =============================================================================

DB_APP="${DB_APP:-db-thrumming-water-5938}"
NS="${NS:-nopal}"
SRC_DB="${SRC_DB:-opuntia}"
DST_DB="${DST_DB:-staging}"
SURREAL_USER="${SURREAL_USER:-root}"
PROXY_PORT="${PROXY_PORT:-8082}"

if [ -z "${SURREAL_PASS:-}" ]; then
  printf 'SURREAL_PASS is not set — export it or pass it inline:\n'
  printf '  SURREAL_PASS=yourprodpassword sh db/clone-to-staging.sh\n'
  exit 1
fi

command -v surreal >/dev/null 2>&1 || {
  printf 'The surreal CLI is not installed locally. Install it first:\n'
  printf '  brew install surrealdb/tap/surreal\n'
  exit 1
}

TMP_FILE="$(mktemp -t nopal-clone-to-staging).surql"

printf 'Opening tunnel to %s on localhost:%s...\n' "${DB_APP}" "${PROXY_PORT}"
fly proxy "${PROXY_PORT}:8080" -a "${DB_APP}" &
PROXY_PID=$!
trap 'kill "${PROXY_PID}" 2>/dev/null; rm -f "${TMP_FILE}"' EXIT INT TERM

for i in $(seq 1 30); do
  curl -sf -o /dev/null "http://localhost:${PROXY_PORT}/health" && break
  sleep 1
done
curl -sf -o /dev/null "http://localhost:${PROXY_PORT}/health" || {
  printf 'Tunnel never became ready — is the fly CLI logged in?\n' >&2
  exit 1
}

printf 'Exporting NS %s / DB %s (prod)...\n' "${NS}" "${SRC_DB}"
surreal export \
  --endpoint "http://localhost:${PROXY_PORT}" \
  --username "${SURREAL_USER}" \
  --password "${SURREAL_PASS}" \
  --namespace "${NS}" \
  --database "${SRC_DB}" \
  "${TMP_FILE}"

SIZE=$(wc -c <"${TMP_FILE}" | tr -d ' ')
if [ "${SIZE}" -lt 100 ]; then
  printf 'Export looks suspiciously small (%s bytes) — aborting before touching staging.\n' "${SIZE}" >&2
  exit 1
fi
printf '  exported %s bytes\n' "${SIZE}"

printf 'Wiping NS %s / DB %s (staging) before reimport...\n' "${NS}" "${DST_DB}"
printf 'REMOVE DATABASE IF EXISTS %s;' "${DST_DB}" | surreal sql \
  --endpoint "http://localhost:${PROXY_PORT}" \
  --username "${SURREAL_USER}" \
  --password "${SURREAL_PASS}" \
  --namespace "${NS}" \
  >/dev/null

printf 'Importing into NS %s / DB %s (staging)...\n' "${NS}" "${DST_DB}"
surreal import \
  --endpoint "http://localhost:${PROXY_PORT}" \
  --username "${SURREAL_USER}" \
  --password "${SURREAL_PASS}" \
  --namespace "${NS}" \
  --database "${DST_DB}" \
  "${TMP_FILE}"

printf '\n✓  staging now mirrors prod as of just now.\n'
printf '   NOTE: this carries prod'"'"'s schema (surreal export includes DEFINE\n'
printf '   statements) but not any migration that landed in opuntia AFTER this\n'
printf '   export and hasn'"'"'t also been applied to staging directly.\n'
