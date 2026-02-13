#!/bin/sh
# First deploy (no prisma/migrations yet): run once from repo root:
#   docker compose -f docker-compose.production.yml run --rm backend npx prisma db push
set -e
# Prisma requires mysql:// protocol; rewrite mariadb:// to mysql:// (MariaDB is MySQL-compatible)
if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q '^mariadb://'; then
  export DATABASE_URL="mysql://${DATABASE_URL#mariadb://}"
fi
if [ -n "$SHADOW_DATABASE_URL" ] && echo "$SHADOW_DATABASE_URL" | grep -q '^mariadb://'; then
  export SHADOW_DATABASE_URL="mysql://${SHADOW_DATABASE_URL#mariadb://}"
fi

echo "Running migrations..."
npx prisma migrate deploy

exec node dist/index.js
