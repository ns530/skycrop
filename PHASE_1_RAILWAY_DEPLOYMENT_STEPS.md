# 🚂 PHASE 1: Railway Deployment - Step-by-Step Guide

**Duration:** 60 minutes  
**Goal:** Deploy backend API with PostgreSQL + Redis  
**Status:** IN PROGRESS 🚀

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] Step 1.1: Create Railway Project (5 min)
- [ ] Step 1.2: Deploy PostgreSQL + PostGIS (10 min)
- [ ] Step 1.3: Deploy Redis (5 min)
- [ ] Step 1.4: Configure Backend Service (10 min)
- [ ] Step 1.5: Set Environment Variables (15 min)
- [ ] Step 1.6: Deploy Backend (10 min)
- [ ] Step 1.7: Run Database Migrations (5 min)
- [ ] Step 1.8: Test & Verify (5 min)
- [ ] Step 1.9: Save Production URLs (5 min)

---

## 🎯 STEP 1.1: CREATE RAILWAY PROJECT

### Action Required:

1. **Open Railway Dashboard:**
   - Go to: https://railway.app/dashboard
   - Click "Login" (you already have an account)

2. **Create New Project:**
   - Click "+ New Project" button (top right)
   - Select "Deploy from GitHub repo"

3. **Connect GitHub:**
   - If not connected, click "Connect GitHub"
   - Authorize Railway to access your repositories
   - Select your `SkyCrop` repository
   - Branch: `main`

4. **Railway will scan your repo:**
   - It should detect: `backend/`, `frontend/`, `mobile/`
   - Don't deploy anything yet - we'll configure services manually

5. **Name your project:**
   - Project name: `skycrop-production` (or just `skycrop`)
   - Click "Create"

### Expected Result:
- ✅ Railway project created
- ✅ GitHub repository connected
- ✅ Empty project dashboard visible

---

## 🗄️ STEP 1.2: DEPLOY POSTGRESQL + POSTGIS

### Action Required:

1. **Add PostgreSQL Service:**
   - In your Railway project dashboard
   - Click "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Wait ~30 seconds for provisioning

2. **Enable PostGIS Extension:**
   - Click on the PostgreSQL service
   - Go to "Data" tab (or "Query" tab if available)
   - Click "Query" or connect via the query interface
   - Run this SQL command:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

   **Alternative if no query tab:**
   - Go to "Connect" tab
   - Copy the "DATABASE_URL" 
   - Use a local PostgreSQL client (pgAdmin, DBeaver, or psql)
   - Connect and run the SQL above

3. **Get Database Connection URL:**
   - In PostgreSQL service, go to "Connect" tab
   - Copy "DATABASE_URL" value
   - Example: `postgresql://postgres:pass@containers-us-west-123.railway.app:7432/railway`
   
4. **Save to deployment_config.txt:**
   - Open `D:\FYP\SkyCrop\deployment_config.txt`
   - Find the line: `DATABASE_URL=`
   - Paste your DATABASE_URL

### Expected Result:
- ✅ PostgreSQL service running
- ✅ PostGIS extension enabled
- ✅ DATABASE_URL copied and saved

### Verification:
```sql
-- Test PostGIS is working:
SELECT PostGIS_version();
-- Should return version info like "3.3 USE_GEOS=1 USE_PROJ=1..."
```

---

## 🔴 STEP 1.3: DEPLOY REDIS

### Action Required:

1. **Add Redis Service:**
   - Back in your Railway project dashboard
   - Click "+ New" button
   - Select "Database" → "Add Redis"
   - Wait ~30 seconds for provisioning

2. **Get Redis Connection URL:**
   - Click on Redis service
   - Go to "Connect" tab
   - Copy "REDIS_URL" value
   - Example: `redis://default:pass@containers-us-west-123.railway.app:6379`

3. **Save to deployment_config.txt:**
   - Open `D:\FYP\SkyCrop\deployment_config.txt`
   - Find the line: `REDIS_URL=`
   - Paste your REDIS_URL

### Expected Result:
- ✅ Redis service running
- ✅ REDIS_URL copied and saved

---

## 🔧 STEP 1.4: CONFIGURE BACKEND SERVICE

### Action Required:

1. **Add Backend Service:**
   - In Railway project dashboard
   - Click "+ New" button
   - Select "GitHub Repo" → Choose your `SkyCrop` repo
   - Railway will start configuring

2. **Configure Build Settings:**
   - Click on the new service (might be named "SkyCrop" or similar)
   - Go to "Settings" tab
   - Scroll to "Service Settings"

3. **Set Root Directory:**
   - Find "Root Directory" setting
   - Enter: `backend`
   - This tells Railway to build from the `backend/` folder

4. **Set Build Command (if needed):**
   - Find "Build Command"
   - Should auto-detect from `package.json`
   - If empty, set to: `npm install`

5. **Set Start Command:**
   - Find "Start Command"
   - Should auto-detect: `npm start`
   - Verify it runs: `node src/server.js`

6. **Set Watch Paths:**
   - Find "Watch Paths"
   - Set to: `backend/**`
   - This ensures rebuilds only when backend changes

7. **Rename Service (Optional):**
   - At top of settings, click service name
   - Rename to: `skycrop-backend`

### Expected Result:
- ✅ Backend service configured
- ✅ Root directory set to `backend`
- ✅ Build and start commands verified

---

## 🔐 STEP 1.5: SET ENVIRONMENT VARIABLES

### Action Required:

1. **Go to Variables Tab:**
   - In backend service, click "Variables" tab
   - Click "Raw Editor" button (easier for bulk paste)

2. **Paste Environment Variables:**
   - Copy this entire block and paste into Raw Editor:

```env
NODE_ENV=production
PORT=3000

# Database (Railway auto-references)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway auto-references)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secret (from deployment_config.txt)
JWT_SECRET=180913647ffcb30e5c662b0c1835aafefedbe6a18bd22a3288ddf01ec92d6330ab973f060bd7e30149ddb7d703b0188c8b135e2d2d9ea111c3f7d57827b7809d

# CORS Origins (will update with Vercel URL later)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# App URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Logging
LOG_LEVEL=info

# WebSocket
WEBSOCKET_PORT=3000
WEBSOCKET_PATH=/socket.io

# Cron Jobs
ENABLE_CRON_JOBS=true

# Feature Flags
ENABLE_FIELD_SHARING=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_DISASTER_DETECTION=true
ENABLE_YIELD_PREDICTION=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

3. **Important Railway Variable Syntax:**
   - `${{Postgres.DATABASE_URL}}` - Auto-references PostgreSQL service
   - `${{Redis.REDIS_URL}}` - Auto-references Redis service
   - `${{RAILWAY_PUBLIC_DOMAIN}}` - Auto-generated public URL

4. **Click "Save" or "Apply"**

### Optional: Add Email/AWS Later
If you want email notifications or S3 uploads, add these later:
```env
# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=skycrop-images
```

### Expected Result:
- ✅ All environment variables set
- ✅ Railway auto-references working
- ✅ JWT secret configured

---

## 🚀 STEP 1.6: DEPLOY BACKEND

### Action Required:

1. **Trigger Deployment:**
   - Railway should auto-deploy after setting variables
   - If not, go to "Deployments" tab
   - Click "Deploy" button

2. **Monitor Build Logs:**
   - Click on the running deployment
   - Watch build logs in real-time
   - Look for these stages:
     - ✅ Fetching code from GitHub
     - ✅ Installing dependencies (`npm install`)
     - ✅ Building application
     - ✅ Starting server (`npm start`)

3. **Wait for Success:**
   - Build typically takes 2-5 minutes
   - Status should change to: "Success" (green checkmark)
   - Service should show: "Active"

4. **Get Public URL:**
   - Go to "Settings" tab
   - Find "Networking" section
   - Click "Generate Domain"
   - You'll get: `skycrop-backend-production-[random].up.railway.app`
   - **Copy this URL!**

5. **Save Backend URL:**
   - Open `deployment_config.txt`
   - Find: `BACKEND_PUBLIC_URL=`
   - Paste your Railway URL

### Expected Result:
- ✅ Build completed successfully
- ✅ Service status: "Active" (green)
- ✅ Public URL generated and saved

### Common Build Errors:

**Error: "Cannot find module"**
- Check `backend/package.json` has all dependencies
- Verify `node_modules` isn't in `.gitignore` incorrectly

**Error: "Build failed"**
- Check Railway logs for specific error
- Verify root directory is `backend`
- Check start command: `node src/server.js`

---

## 🗃️ STEP 1.7: RUN DATABASE MIGRATIONS

### Option A: Using Railway CLI (Recommended)

1. **Install Railway CLI:**
```powershell
npm install -g @railway/cli
```

2. **Login to Railway:**
```powershell
railway login
```
   - Opens browser for authentication
   - Click "Authorize"

3. **Link to Project:**
```powershell
cd D:\FYP\SkyCrop\backend
railway link
```
   - Select your project: `skycrop-production`
   - Select service: `skycrop-backend`

4. **Run Migrations:**
```powershell
railway run npm run migrate
```
   - This runs migrations against Railway database
   - Or run seed if you have one: `railway run npm run seed`

### Option B: Using Railway Shell

1. **Open Railway Dashboard**
2. **Go to backend service**
3. **Click on "..." menu → Shell**
4. **In the shell, run:**
```bash
cd /app
npm run migrate
# Or if you have a seed: npm run seed
```

### Option C: Run Migrations Manually

1. **Connect to Railway DB from local:**
```powershell
cd D:\FYP\SkyCrop\backend

# Set DATABASE_URL from Railway (the one you saved)
$env:DATABASE_URL="postgresql://postgres:pass@containers-us-west-123.railway.app:7432/railway"

# Run migrations locally (connects to Railway DB)
npm run migrate
```

### Expected Result:
- ✅ Migrations executed successfully
- ✅ Database tables created
- ✅ Schema up to date

### Verify Migrations:
In Railway PostgreSQL Query tab, run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```
Should show tables like: `users`, `fields`, `recommendations`, etc.

---

## 🧪 STEP 1.8: TEST & VERIFY BACKEND

### Test 1: Health Endpoint

1. **Get your backend URL** (from Step 1.6)
   - Example: `https://skycrop-backend-production-xyz.up.railway.app`

2. **Test in browser:**
   - Open: `https://YOUR-BACKEND-URL.up.railway.app/api/v1/health`
   - Or use PowerShell:

```powershell
$backendUrl = "https://skycrop-backend-production-xyz.up.railway.app"
Invoke-RestMethod -Uri "$backendUrl/api/v1/health" | ConvertTo-Json
```

3. **Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-22T10:30:00.000Z",
  "database": "connected",
  "redis": "connected",
  "uptime": 123
}
```

### Test 2: API Base Path

```powershell
Invoke-RestMethod -Uri "$backendUrl/api/v1" | ConvertTo-Json
```

Expected: Welcome message or API info

### Test 3: Check Logs

1. **In Railway Dashboard:**
   - Go to backend service
   - Click "Logs" tab (or "View Logs")
   - Should see:
     - ✅ Server started on port 3000
     - ✅ Database connected
     - ✅ Redis connected
     - ✅ No critical errors

### Expected Result:
- ✅ Health endpoint returns 200 OK
- ✅ Database status: "connected"
- ✅ Redis status: "connected"
- ✅ No errors in logs

### Troubleshooting:

**Issue: Health endpoint returns 502/503**
- Service might still be starting (wait 1 minute)
- Check logs for startup errors
- Verify environment variables are set

**Issue: Database: "disconnected"**
- Check DATABASE_URL variable format
- Verify PostgreSQL service is running
- Check PostGIS extension is enabled

**Issue: Redis: "disconnected"**
- Check REDIS_URL variable format
- Verify Redis service is running

---

## 💾 STEP 1.9: SAVE PRODUCTION URLS

### Update deployment_config.txt:

```powershell
# Open deployment_config.txt and update:

RAILWAY_PROJECT_ID=[Get from Railway dashboard URL]
BACKEND_PUBLIC_URL=https://skycrop-backend-production-xyz.up.railway.app

DATABASE_URL=[Your PostgreSQL URL]
REDIS_URL=[Your Redis URL]
```

### Save for Next Phases:
These URLs will be needed for:
- Phase 2: Vercel (frontend needs backend URL)
- Phase 3: Expo (mobile needs backend URL)

---

## ✅ PHASE 1 COMPLETION CHECKLIST

Before moving to Phase 2, verify:

- [ ] Railway project created
- [ ] PostgreSQL deployed with PostGIS
- [ ] Redis deployed
- [ ] Backend service deployed and active
- [ ] All environment variables set
- [ ] Database migrations executed
- [ ] Health endpoint returns 200 OK
- [ ] Database connected
- [ ] Redis connected
- [ ] Backend URL saved in deployment_config.txt
- [ ] No critical errors in logs

---

## 🎉 PHASE 1 COMPLETE!

**When all checks pass, you'll have:**
- ✅ Backend API running on Railway
- ✅ PostgreSQL database with PostGIS
- ✅ Redis cache
- ✅ Public URL: `https://skycrop-backend-production-[id].up.railway.app`
- ✅ Healthy API responding to requests

**Your backend is now LIVE! 🚀**

---

## ⏭️ NEXT: PHASE 2 - VERCEL DEPLOYMENT

**What we'll deploy:**
- React frontend dashboard
- Connect to Railway backend
- Get public URL for web app

**Time needed:** 30 minutes

**Say: "Start Phase 2" when ready!**

---

## 📞 NEED HELP?

### Railway Support:
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Common Commands:
```powershell
# Railway CLI
railway login          # Login to Railway
railway link           # Link to project
railway run [command]  # Run command with Railway env
railway logs           # View logs
railway status         # Check status

# Test backend
Invoke-RestMethod -Uri "https://YOUR-URL/api/v1/health"
```

---

**Let me know when you complete each step, and I'll guide you through! 🚀**

