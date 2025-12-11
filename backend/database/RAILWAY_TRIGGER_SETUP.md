# Railway Database Trigger Setup Guide

## Problem

The `compute_field_metrics` trigger is missing or not working, causing field creation to fail with:

```
notNull Violation: Field.area_sqm cannot be null, Field.center cannot be null
```

## Solution

Run the migration SQL to ensure the trigger is set up correctly.

## Method 1: Using Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):

   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:

   ```bash
   railway login
   ```

3. **Link to your project**:

   ```bash
   cd backend
   railway link
   ```

4. **Run the migration**:
   ```bash
   railway run node src/scripts/migrate.js
   ```

## Method 2: Using Railway Dashboard

1. Go to your Railway project dashboard
2. Select your **PostgreSQL** service
3. Click on **"Data"** or **"Query"** tab
4. Copy and paste the contents of `database/migrations/003_ensure_field_metrics_trigger.sql`
5. Click **"Run"** or **"Execute"**

## Method 3: Using psql (Direct Connection)

1. **Get your DATABASE_URL from Railway**:
   - Go to PostgreSQL service → Variables → Copy `DATABASE_URL`

2. **Connect using psql**:

   ```bash
   psql $DATABASE_URL
   ```

3. **Run the migration SQL**:

   ```sql
   \i backend/database/migrations/003_ensure_field_metrics_trigger.sql
   ```

   Or copy-paste the SQL directly into psql.

## Method 4: Using Node.js Script Locally

1. **Set DATABASE_URL**:

   ```bash
   export DATABASE_URL="your-railway-database-url"
   ```

2. **Run migration**:
   ```bash
   cd backend
   node src/scripts/migrate.js
   ```

## Verification

After running the migration, verify the trigger exists:

```sql
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trg_fields_compute';
```

You should see:

```
trigger_name        | table_name | function_name
--------------------+------------+------------------
trg_fields_compute  | fields     | compute_field_metrics
```

## Test Field Creation

After setting up the trigger, test creating a field through your mobile app. The trigger should automatically calculate:

- `area_sqm`: Area in square meters from the boundary
- `center`: Centroid point of the boundary

## Troubleshooting

If the trigger still doesn't work:

1. **Check if PostGIS is enabled**:

   ```sql
   SELECT PostGIS_version();
   ```

2. **Check trigger function exists**:

   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'compute_field_metrics';
   ```

3. **Manually test the function**:

   ```sql
   -- Create a test boundary
   SELECT compute_field_metrics();
   ```

4. **Check Railway logs** for any errors during migration
