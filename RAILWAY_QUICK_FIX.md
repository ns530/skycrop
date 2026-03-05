# Railway Service Connection - Quick Fix

## 🚀 Quick Steps (5 minutes)

### In Railway Dashboard:

1. **Go to your Backend Service**
   - Click on your backend service in Railway dashboard

2. **Open Variables Tab**
   - Click **"Variables"** tab

3. **Add Variable Reference for PostGIS**
   - Click **"+ New Variable"** or **"Add Variable"**
   - Select **"Reference"** option (not "Plain" variable)
   - Choose your **PostGIS/PostgreSQL service** from dropdown
   - Select **`DATABASE_URL`** from available variables
   - Railway will show: `${{Postgres.DATABASE_URL}}` (or similar)

4. **Add Private URL (Recommended)**
   - Add another reference: **`DATABASE_PRIVATE_URL`**
   - Select from your PostGIS service
   - This is better for internal connections

5. **Wait for Redeploy**
   - Railway will automatically redeploy your backend
   - Check the **Logs** tab for: `Database connection established successfully.`

## ✅ That's It!

Your backend code has been updated to automatically recognize Railway's standard variable names:
- `DATABASE_URL` ✅
- `DATABASE_PRIVATE_URL` ✅

No need to add aliases or change variable names!

## 🔍 Verify It Worked

Check your backend service logs. You should see:
```
Database connection established successfully.
```

If you see connection errors, double-check:
- PostGIS service is running (green status)
- Variable references are set correctly
- Service names match exactly

## 📝 Visual Guide

```
Railway Dashboard
├── Your Project
    ├── Backend Service
    │   └── Variables Tab
    │       └── + New Variable
    │           └── Reference
    │               └── Select PostGIS Service
    │                   └── Select DATABASE_URL
    │
    └── PostGIS Service (PostgreSQL)
        └── Provides: DATABASE_URL, DATABASE_PRIVATE_URL
```

## 🆘 Still Having Issues?

See `RAILWAY_SERVICE_CONNECTION_GUIDE.md` for detailed troubleshooting.
