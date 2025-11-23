#!/bin/bash
# Run database migration on Railway
# This script connects to Railway database and runs all migrations

set -e

echo "🚀 SkyCrop Database Migration Script for Railway"
echo "================================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo ""
  echo "To get your Railway DATABASE_URL:"
  echo "1. Go to your Railway project dashboard"
  echo "2. Select your PostgreSQL service"
  echo "3. Go to Variables tab"
  echo "4. Copy the DATABASE_URL value"
  echo ""
  echo "Then run:"
  echo "  export DATABASE_URL='your-database-url'"
  echo "  ./scripts/run-migration-railway.sh"
  exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Run the migration script
cd "$(dirname "$0")/.."
node src/scripts/migrate.js

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "The compute_field_metrics trigger should now be active."
echo "You can verify by creating a field through the API."

