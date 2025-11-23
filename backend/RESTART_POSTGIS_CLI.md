# Restart PostGIS Service via Railway CLI

## Current Status
PostGIS service is crashed and needs to be restarted.

## Railway CLI Limitations
Railway CLI doesn't have a direct `restart` command for services. However, you can:

### Option 1: Railway Dashboard (Easiest)
1. Go to https://railway.app
2. Select **skycrop-staging** project
3. Click on **PostGIS** service
4. Click **"Restart"** button (top right)
5. Wait 2-3 minutes for service to restart

### Option 2: Trigger Redeploy (via CLI)
You can trigger a redeploy which will restart the service:
```bash
# This will trigger a new deployment
railway up
```

### Option 3: Check Resource Limits
PostGIS might be crashing due to resource limits:
1. Railway Dashboard → PostGIS service → **Settings** → **Resources**
2. Check:
   - Memory: Should be at least 512MB (1GB recommended)
   - CPU: Should be at least 0.5 vCPU
3. Increase if needed and restart

### Option 4: Check Logs for Specific Error
```bash
railway logs --lines 200
```
Look for:
- Out of memory errors
- Configuration errors
- Connection limit errors

## Quick Fix Commands

```bash
# Switch to PostGIS service
railway service
# Select: PostGIS

# Check recent logs
railway logs --lines 50

# Check variables
railway variables
```

## After Restart
Once PostGIS is restarted, verify it's working:
```bash
railway run node src/scripts/verify-trigger.js
```

