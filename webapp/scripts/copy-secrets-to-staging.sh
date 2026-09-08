#!/bin/sh
set -e

# =============================================================================
# copy-secrets-to-staging.sh — Copies prod webapp secrets to the staging app,
# read-then-set entirely within YOUR terminal (never through a third party's
# context) — `fly secrets list` only shows digests, not values, on purpose,
# so this reads each value directly off a running prod machine instead.
#
# Run this yourself, locally:
#   sh webapp/scripts/copy-secrets-to-staging.sh
#
# Safe to re-run any time prod secrets rotate.
#
# IMPORTANT: targets ONE specific prod machine explicitly (--machine).
# `fly ssh console -C` with no machine specified, against an app with more
# than one machine (true since prod was scaled to 2), prints a
# "No machine specified, using <id> in region <region>" NOTICE straight to
# STDOUT — which silently prepends itself to every secret's value here if
# not suppressed this way. Confirmed this actually happened on a real run:
# RESEND_API_KEY came back as "No machine specified, using ... in region
# lax\nre_<realkey>", which then broke at runtime (an invalid HTTP header
# value) rather than failing loudly at copy time. If you ever see a secret
# misbehave after running this script, assume ALL of them are suspect (the
# same command ran in a loop for every name) and re-run after this fix
# rather than special-casing just the one that happened to crash first.
PROD_APP="${PROD_APP:-webapp-billowing-meadow-8538}"
STAGING_APP="${STAGING_APP:-nopal-webapp-staging}"
PROD_MACHINE="${PROD_MACHINE:-}"

if [ -z "${PROD_MACHINE}" ]; then
  PROD_MACHINE=$(fly machine list --app "${PROD_APP}" --json 2>/dev/null | grep -o '"id": *"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
fi
if [ -z "${PROD_MACHINE}" ]; then
  printf 'Could not determine a prod machine id — pass one explicitly:\n'
  printf '  PROD_MACHINE=<id> sh webapp/scripts/copy-secrets-to-staging.sh\n'
  exit 1
fi
printf 'Reading secrets from machine %s...\n' "${PROD_MACHINE}"

# Every secret staging should share with prod verbatim. DATABASE_DATABASE
# is deliberately NOT in this list — it's set via [env] in
# webapp/fly.staging.toml instead, to the isolated `staging` database.
SECRETS="
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
SESSION_SECRET
ENCRYPTION_SECRET
RESEND_API_KEY
NOTION_TOKEN
NOTION_WEBHOOK_SECRET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
WS_ACCESS_KEY_ID
BUCKET_NAME
S3_ENDPOINT
S3_PUBLIC_HOSTNAME
REDIS_URL
DISCORD_BOT_TOKEN
DISCORD_CHANNEL_ID
CRON_SECRET
WEBSITE_PROJECT_FOLDER_ID
NODE_ENV
"

printf 'Copying secrets from %s to %s...\n' "${PROD_APP}" "${STAGING_APP}"

for name in ${SECRETS}; do
  value=$(fly ssh console --app "${PROD_APP}" --machine "${PROD_MACHINE}" -C "printenv ${name}" 2>/dev/null | tr -d '\r')
  if [ -z "${value}" ]; then
    printf '  ⚠️  %s is empty on prod — skipping\n' "${name}"
    continue
  fi
  fly secrets set --app "${STAGING_APP}" "${name}=${value}" --stage >/dev/null
  printf '  ✓  %s\n' "${name}"
done

printf '\nStaging deploys with all secrets staged in one release (--stage above\n'
printf 'queues them without redeploying per-secret). Deploy now to apply them:\n'
printf '  make deploy-staging\n'
