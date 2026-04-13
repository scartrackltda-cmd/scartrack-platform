#!/bin/sh
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      Scartrack Platform - VPS        ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Wait for database to be ready (extra safety beyond healthcheck)
echo "⏳  Checking database connection..."
MAX_RETRIES=30
RETRY=0

until node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.\$connect().then(() => { console.log('DB OK'); p.\$disconnect(); process.exit(0); })
    .catch(() => process.exit(1));
" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "❌  Could not connect to database after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "   Waiting for database... ($RETRY/$MAX_RETRIES)"
  sleep 2
done

echo "✅  Database connected."
echo ""

# Run Prisma migrations
echo "🔄  Running database migrations..."
node node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma
echo "✅  Migrations complete."
echo ""

# Start the Next.js production server
echo "🚀  Starting Scartrack Platform on port $PORT..."
echo ""
exec node server.js
