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
# =============================================================================

PROD_APP="${PROD_APP:-webapp-billowing-meadow-8538}"
STAGING_APP="${STAGING_APP:-nopal-webapp-staging}"

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
  value=$(fly ssh console --app "${PROD_APP}" -C "printenv ${name}" 2>/dev/null | tr -d '\r')
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
