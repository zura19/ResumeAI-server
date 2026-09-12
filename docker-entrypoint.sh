#!/bin/sh
set -e

echo "==> Running Prisma database migrations..."
npx prisma migrate deploy

echo "==> Running Prisma database seeding..."
node dist/prisma/seed.js || echo "⚠️ Seeding skipped or encountered an error"

echo "==> Starting NestJS application..."
exec "$@"