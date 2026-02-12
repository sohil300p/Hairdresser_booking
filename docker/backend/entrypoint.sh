#!/bin/sh
# First deploy (no prisma/migrations yet): run once from repo root:
#   docker compose -f docker-compose.production.yml run --rm backend npx prisma db push
set -e
npx prisma migrate deploy || true
exec node dist/index.js
