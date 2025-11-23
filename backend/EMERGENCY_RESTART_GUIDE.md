# Emergency Service Restart Guide

## 🚨 Both Backend and PostGIS Services Crashed

### Current Status
- **Backend**: Running but can't connect to PostGIS
- **PostGIS**: Down (connection terminated)
- **Issue**: Services need to be restarted

## ✅ Solution: Railway Dashboard (Required)

Railway CLI **does not support** restarting services directly. You **must** use the Railway Dashboard.

### Step 1: Restart PostGIS Service
1. Go to: **https://railway.app**
2. Login and select **"skycrop-staging"** project
3. Click on **"PostGIS"** service
4. Click **"Restart"** button (top-right)
5. **Wait 3-5 minutes** for PostGIS to fully start

### Step 2: Restart Backend Service
1. In the same project, click on **"skycrop-staging"** service (backend)
2. Click **"Restart"** button
3. **Wait 2-3 minutes** for backend to restart

### Step 3: Verify Services
After both restart, verify they're working:

```bash
cd backend

# Check PostGIS
railway service
# Select: PostGIS
railway run node scripts/check-postgis-health.js

# Check Backend
railway service
# Select: skycrop-staging
railway logs --lines 20
```

## 🔄 Alternative: Trigger Redeploy

If restart doesn't work, you can trigger a redeploy:

```bash
cd backend
railway up
```

This will redeploy the backend service (but won't restart PostGIS).

## ⚠️ Important Notes

1. **PostGIS must be restarted first** - Backend depends on it
2. **Wait for PostGIS to be fully ready** before restarting backend
3. **Check resource limits** if services keep crashing:
   - PostGIS: At least 512MB RAM, 0.5 vCPU
   - Backend: At least 256MB RAM, 0.25 vCPU

## 🎯 Expected Behavior After Restart

1. PostGIS starts and accepts connections
2. Backend connects successfully
3. Migrations run automatically
4. Server is fully operational

---

**Note**: Railway CLI/MCP cannot restart services. Dashboard is the only way.

