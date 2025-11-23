# Quick Fix: Restart PostGIS Service

## 🚨 Current Status
PostGIS service is **DOWN** - connection timeout errors.

## ✅ Solution: Restart via Railway Dashboard

### Step 1: Open Railway Dashboard
1. Go to: **https://railway.app**
2. Login to your account

### Step 2: Navigate to PostGIS Service
1. Click on **"skycrop-staging"** project
2. Find **"PostGIS"** service in the services list
3. Click on it

### Step 3: Restart Service
1. Look for **"Restart"** button (usually top-right corner)
2. Click **"Restart"**
3. Wait **2-3 minutes** for service to fully restart

### Step 4: Verify It's Working
After restart, run this command:
```bash
cd backend
railway service
# Select: PostGIS
railway run node scripts/check-postgis-health.js
```

You should see:
```
✅ PostGIS service is healthy and operational!
```

## 🔍 Alternative: Check Resource Limits

If PostGIS keeps crashing, check resource limits:

1. Railway Dashboard → PostGIS service → **Settings** → **Resources**
2. Ensure:
   - **Memory**: At least 512MB (1GB recommended)
   - **CPU**: At least 0.5 vCPU
3. If too low, increase and restart

## 📊 Check Logs

To see what caused the crash:
1. Railway Dashboard → PostGIS service → **Logs** tab
2. Look for:
   - Out of memory errors
   - Configuration errors
   - Database corruption errors

## ⚡ Quick Commands

```bash
# Switch to PostGIS service
railway service
# Select: PostGIS

# Check health
railway run node scripts/check-postgis-health.js

# Check logs
railway logs --lines 50
```

## 🎯 After Restart

Once PostGIS is restarted:
1. Backend will automatically reconnect (with retry logic)
2. Migrations will run in background
3. Server will be fully operational

---

**Note:** Railway CLI doesn't support service restarts directly. Use the dashboard for this operation.

