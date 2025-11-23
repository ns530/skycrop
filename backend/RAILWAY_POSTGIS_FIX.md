# Railway PostGIS Service Crash - Quick Fix Guide

## Problem
PostGIS service is crashing/restarting, causing `ECONNRESET` errors when backend tries to connect.

## Symptoms
- Backend can't connect to database
- Migration errors: "Connection terminated unexpectedly"
- Service keeps restarting

## Solutions

### Option 1: Restart PostGIS Service (Railway Dashboard)
1. Go to Railway Dashboard: https://railway.app
2. Select your **skycrop-staging** project
3. Click on **PostGIS** service
4. Click **"Restart"** button
5. Wait 1-2 minutes for service to restart

### Option 2: Check PostGIS Resource Limits
1. Go to Railway Dashboard → PostGIS service
2. Check **"Settings"** → **"Resources"**
3. Ensure:
   - Memory: At least 512MB (1GB recommended)
   - CPU: At least 0.5 vCPU
4. If limits are too low, increase them

### Option 3: Check PostGIS Logs for Specific Errors
1. Railway Dashboard → PostGIS service → **"Logs"** tab
2. Look for:
   - Out of memory errors
   - Configuration errors
   - Connection limit errors

### Option 4: Recreate PostGIS Service (Last Resort)
If service is completely broken:
1. **Backup your data first!** (Export database)
2. Railway Dashboard → PostGIS service → **"Settings"** → **"Delete"**
3. Create new PostGIS service
4. Run migrations: `railway run node src/scripts/migrate.js`

## Quick Check Commands

```bash
# Check if PostGIS is running
railway logs --service PostGIS --lines 20

# Test database connection
railway run node -e "const { Pool } = require('pg'); const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); p.query('SELECT NOW()').then(() => { console.log('✅ Connected'); p.end(); }).catch(e => { console.error('❌ Error:', e.message); p.end(); process.exit(1); });"
```

## Prevention
- Monitor PostGIS memory usage
- Set appropriate resource limits
- Consider upgrading PostGIS plan if needed

