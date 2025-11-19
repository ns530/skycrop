# 🚀 SKYCROP STAGING DEPLOYMENT GUIDE

**Status**: 🔄 IN PROGRESS  
**Started**: November 19, 2025  
**Target**: Deploy all services to staging within 2 days  
**Deployment Platform**: Railway (recommended for speed)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ **What You Already Have**
- [x] Backend API (Node.js + Express)
- [x] Frontend (React + Vite)
- [x] ML Service (Python + Flask)
- [x] PostgreSQL database schema
- [x] Docker Compose for local dev
- [x] All services running locally

### ⏳ **What We'll Create**
- [ ] Staging environment on Railway
- [ ] PostgreSQL database on Railway
- [ ] Redis instance on Railway
- [ ] Environment variables configured
- [ ] All services deployed and connected
- [ ] HTTPS enabled
- [ ] Staging URLs accessible

---

## 🎯 DEPLOYMENT STRATEGY

### **Platform Choice: Railway** 🚂

**Why Railway?**
- ✅ **Free Tier**: $5 credit (enough for testing)
- ✅ **Fast**: Deploy with Git push
- ✅ **Managed Services**: PostgreSQL, Redis included
- ✅ **Auto SSL**: HTTPS out of the box
- ✅ **Zero Config**: Detects Node.js/Python automatically
- ✅ **Logs**: Built-in log viewer
- ✅ **Environment Variables**: Easy to manage

**Alternative Options:**
- Heroku (easier but more expensive)
- Render (good alternative, similar to Railway)
- AWS/GCP (overkill for MVP, complex setup)
- Vercel + Heroku combo (frontend + backend separate)

---

## 🗺️ DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    STAGING ENVIRONMENT                   │
│                    (Railway Platform)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Frontend (skycrop-staging-web.railway.app)    │    │
│  │  - React + Vite                                │    │
│  │  - Served as static files                      │    │
│  │  - HTTPS enabled                               │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │ API Calls                            │
│                   ▼                                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  Backend API (skycrop-staging-api.railway.app) │    │
│  │  - Node.js + Express                           │    │
│  │  - Port 3000 → Railway assigns public URL      │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
│         ┌─────────┼─────────┐                          │
│         ▼         ▼         ▼                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │PostgreSQL│ │  Redis   │ │ML Service│              │
│  │(Railway) │ │(Railway) │ │ (Flask)  │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ STEP-BY-STEP DEPLOYMENT

### **PHASE 1: PREPARATION** (30 minutes)

#### **Step 1.1: Create Railway Account**

```bash
# 1. Go to https://railway.app
# 2. Click "Sign up with GitHub"
# 3. Authorize Railway to access your GitHub
# 4. Verify email
# 5. You get $5 free credit (no credit card needed!)
```

**✅ Verification:**
- [ ] Railway dashboard accessible
- [ ] $5.00 credit shows in account
- [ ] GitHub connected

---

#### **Step 1.2: Install Railway CLI**

**Windows (PowerShell as Administrator):**
```powershell
# Using npm (you already have Node.js)
npm install -g @railway/cli

# Verify installation
railway --version
```

**Login:**
```bash
railway login
# Opens browser, click "Authorize"
```

**✅ Verification:**
```bash
railway whoami
# Should show your username
```

---

#### **Step 1.3: Prepare Environment Variables**

Create `.env.staging` file in project root:

```bash
# .env.staging
# Backend API Environment Variables

# Database (Railway will provide these - PLACEHOLDERS for now)
DATABASE_URL=postgresql://user:pass@host:5432/skycrop_staging
DB_HOST=<railway-postgres-host>
DB_PORT=5432
DB_NAME=skycrop_staging
DB_USER=<railway-postgres-user>
DB_PASSWORD=<railway-postgres-password>

# Redis (Railway will provide these)
REDIS_URL=redis://user:pass@host:6379

# JWT Secret (GENERATE NEW FOR STAGING!)
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRY=30d

# Google OAuth (Create new OAuth app for staging)
GOOGLE_CLIENT_ID=<your-staging-google-client-id>
GOOGLE_CLIENT_SECRET=<your-staging-google-client-secret>
GOOGLE_CALLBACK_URL=https://skycrop-staging-api.railway.app/api/v1/auth/google/callback

# Frontend URL
FRONTEND_URL=https://skycrop-staging-web.railway.app
CORS_ORIGIN=https://skycrop-staging-web.railway.app

# ML Service
ML_SERVICE_URL=https://skycrop-staging-ml.railway.app
ML_INTERNAL_TOKEN=<generate-with-openssl-rand-base64-32>

# Sentinel Hub (Use your existing credentials or test account)
SENTINEL_HUB_CLIENT_ID=<your-sentinel-client-id>
SENTINEL_HUB_CLIENT_SECRET=<your-sentinel-secret>

# Email Service (Use Mailgun free tier)
MAILGUN_API_KEY=<your-mailgun-key>
MAILGUN_DOMAIN=<your-mailgun-domain>

# Environment
NODE_ENV=staging
PORT=3000
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate Secrets:**
```bash
# JWT Secret
openssl rand -base64 32

# ML Internal Token
openssl rand -base64 32

# Copy these outputs for later
```

---

#### **Step 1.4: Prepare Deployment Files**

**Create `backend/railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Create `backend/package.json` start script (if not exists):**
```json
{
  "scripts": {
    "start": "node src/server.js",
    "start:prod": "NODE_ENV=production node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

**Create `ml-service/railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:app",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Create `frontend/.env.staging`:**
```bash
VITE_API_URL=https://skycrop-staging-api.railway.app
VITE_ML_SERVICE_URL=https://skycrop-staging-ml.railway.app
VITE_ENV=staging
```

---

### **PHASE 2: DEPLOY BACKEND + DATABASE** (45 minutes)

#### **Step 2.1: Create Railway Project**

```bash
# Navigate to project root
cd D:\FYP\SkyCrop

# Create new Railway project
railway init

# Follow prompts:
# - Project name: skycrop-staging
# - Create new project: Yes
```

**✅ Verification:**
```bash
railway status
# Should show project: skycrop-staging
```

---

#### **Step 2.2: Add PostgreSQL Database**

**Via Railway Dashboard:**
1. Go to https://railway.app/dashboard
2. Click your project: `skycrop-staging`
3. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
4. Railway provisions database (~30 seconds)
5. Click PostgreSQL service → **"Variables"** tab
6. Copy these values:
   - `DATABASE_URL`
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

**✅ Verification:**
```bash
# Railway CLI will show database connection
railway variables
```

---

#### **Step 2.3: Add Redis Cache**

**Via Railway Dashboard:**
1. In your project, click **"+ New"** → **"Database"** → **"Add Redis"**
2. Railway provisions Redis (~20 seconds)
3. Click Redis service → **"Variables"** tab
4. Copy `REDIS_URL`

**✅ Verification:**
```bash
railway variables
# Should show REDIS_URL
```

---

#### **Step 2.4: Deploy Backend API**

```bash
# Navigate to backend folder
cd backend

# Link to Railway project
railway link

# Set environment variables
railway variables set NODE_ENV=staging
railway variables set JWT_SECRET="<your-generated-secret>"
railway variables set PORT=3000
railway variables set CORS_ORIGIN="https://skycrop-staging-web.railway.app"

# Deploy!
railway up

# Watch deployment logs
railway logs
```

**Deployment takes 2-5 minutes. Watch for:**
- ✅ "Build successful"
- ✅ "Deployment successful"
- ✅ "Service is live"

**✅ Verification:**
```bash
# Get your backend URL
railway domain

# Example output: skycrop-staging-api.up.railway.app

# Test health endpoint
curl https://<your-backend-url>/health

# Should return:
# {"status":"ok","version":"0.1.0","timestamp":"..."}
```

---

#### **Step 2.5: Run Database Migrations**

**Option A: Via Railway CLI**
```bash
# Connect to Railway environment
railway run npm run migrate:up

# Or manually run SQL
railway connect postgres

# In psql shell:
\i database/init.sql
\q
```

**Option B: Via pgAdmin**
```bash
# Get DATABASE_URL from Railway
railway variables get DATABASE_URL

# Connect pgAdmin with:
# - Host: <from PGHOST>
# - Port: <from PGPORT>
# - Database: <from PGDATABASE>
# - Username: <from PGUSER>
# - Password: <from PGPASSWORD>

# Run database/init.sql
```

**✅ Verification:**
```bash
# Check tables exist
railway connect postgres
\dt
# Should show: users, fields, health_records, etc.
```

---

### **PHASE 3: DEPLOY ML SERVICE** (30 minutes)

#### **Step 3.1: Deploy ML Service**

```bash
# Navigate to ml-service folder
cd ../ml-service

# Add to same Railway project (creates new service)
railway up

# Set environment variables
railway variables set ML_HOST=0.0.0.0
railway variables set ML_PORT=8001
railway variables set ML_INTERNAL_TOKEN="<your-generated-token>"

# Deploy
railway up

# Watch logs
railway logs
```

**✅ Verification:**
```bash
# Get ML service URL
railway domain

# Test health endpoint
curl https://<your-ml-url>/health

# Should return:
# {"status":"ok","version":"...","uptime_s":...}
```

---

#### **Step 3.2: Connect Backend to ML Service**

```bash
# Back to backend folder
cd ../backend

# Set ML service URL
railway variables set ML_SERVICE_URL="https://<your-ml-url>"
railway variables set ML_INTERNAL_TOKEN="<same-token-as-ml-service>"

# Redeploy backend
railway up
```

**✅ Verification:**
```bash
# Test ML endpoint through backend
curl -X POST https://<backend-url>/api/v1/ml/segmentation/predict \
  -H "Content-Type: application/json" \
  -d '{"bbox":[80.0,7.0,81.0,8.0],"date":"2024-11-01"}'

# Should return boundary prediction
```

---

### **PHASE 4: DEPLOY FRONTEND** (30 minutes)

#### **Step 4.1: Build Frontend with Staging Config**

```bash
cd ../frontend

# Set API URL for build
echo "VITE_API_URL=https://<your-backend-url>" > .env.production

# Build for production
npm run build

# Output in dist/ folder
```

**✅ Verification:**
```bash
ls dist/
# Should show: index.html, assets/, ...
```

---

#### **Step 4.2: Deploy Frontend to Railway**

**Option A: Static Site Deployment**
```bash
# Deploy static files
railway up

# Railway detects Vite and serves dist/
```

**Option B: Better - Use Vercel (Recommended for Frontend)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel (better for static sites)
vercel --prod

# Follow prompts:
# - Project name: skycrop-staging-web
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist

# Note the URL: https://skycrop-staging-web.vercel.app
```

---

#### **Step 4.3: Update Backend CORS**

```bash
cd ../backend

# Update CORS origin to match frontend URL
railway variables set CORS_ORIGIN="https://<your-frontend-url>"

# Redeploy
railway up
```

---

### **PHASE 5: CONFIGURE GOOGLE OAUTH** (15 minutes)

#### **Step 5.1: Create Staging OAuth App**

1. Go to https://console.cloud.google.com/apis/credentials
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Application type: **Web application**
4. Name: **SkyCrop Staging**
5. Authorized redirect URIs:
   ```
   https://<your-backend-url>/api/v1/auth/google/callback
   ```
6. Click **"Create"**
7. Copy **Client ID** and **Client Secret**

#### **Step 5.2: Update Backend OAuth Config**

```bash
cd backend

railway variables set GOOGLE_CLIENT_ID="<your-staging-client-id>"
railway variables set GOOGLE_CLIENT_SECRET="<your-staging-client-secret>"
railway variables set GOOGLE_CALLBACK_URL="https://<your-backend-url>/api/v1/auth/google/callback"

# Redeploy
railway up
```

---

### **PHASE 6: FINAL VERIFICATION** (30 minutes)

#### **Step 6.1: Smoke Test All Services**

**✅ Backend Health:**
```bash
curl https://<backend-url>/health
# Expected: {"status":"ok"}
```

**✅ ML Service Health:**
```bash
curl https://<ml-url>/health
# Expected: {"status":"ok"}
```

**✅ Frontend Loading:**
```bash
# Open in browser
https://<frontend-url>
# Expected: Login page loads
```

**✅ Database Connection:**
```bash
# Try to signup
curl -X POST https://<backend-url>/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test User"}'

# Expected: {"success":true,"data":{"token":"..."}}
```

---

#### **Step 6.2: Full User Flow Test**

**Manual Testing:**

1. **Signup Flow:**
   - [ ] Go to `https://<frontend-url>/signup`
   - [ ] Enter email, password, name
   - [ ] Click "Sign Up"
   - [ ] Should redirect to dashboard

2. **Login Flow:**
   - [ ] Logout
   - [ ] Go to `/login`
   - [ ] Enter credentials
   - [ ] Should login successfully

3. **Google OAuth:**
   - [ ] Click "Login with Google"
   - [ ] Authorize
   - [ ] Should redirect to dashboard

4. **Create Field:**
   - [ ] Click "Create Field"
   - [ ] Enter field name
   - [ ] Click on map to set location
   - [ ] Should detect boundary (may take 60s)
   - [ ] Save field

5. **View Field:**
   - [ ] See field on map
   - [ ] Check field details
   - [ ] View health data (may be empty)

6. **Check All Pages:**
   - [ ] Dashboard
   - [ ] Fields List
   - [ ] Field Detail
   - [ ] Health Page
   - [ ] Recommendations
   - [ ] News
   - [ ] Settings

---

## 🔧 TROUBLESHOOTING

### **Problem: Backend Crashes on Startup**

**Check Logs:**
```bash
cd backend
railway logs
```

**Common Issues:**
- ❌ Missing environment variables
  - Fix: `railway variables set KEY=value`
- ❌ Database connection failed
  - Fix: Check DATABASE_URL is set correctly
- ❌ Port binding error
  - Fix: Ensure PORT=3000 or use Railway's $PORT

---

### **Problem: ML Service Out of Memory**

**Solution: Increase Memory**
```bash
cd ml-service
railway up --memory 2048
```

---

### **Problem: Frontend Can't Reach Backend (CORS)**

**Check:**
1. Backend CORS_ORIGIN matches frontend URL exactly
2. Frontend .env has correct VITE_API_URL
3. Both services deployed and running

**Fix:**
```bash
cd backend
railway variables set CORS_ORIGIN="https://<exact-frontend-url>"
railway up
```

---

### **Problem: Database Tables Missing**

**Run Migrations Again:**
```bash
cd backend
railway connect postgres
\i database/init.sql
\q
```

---

## 📊 POST-DEPLOYMENT CHECKLIST

### **✅ All Services Running**
- [ ] Backend API responds to /health
- [ ] ML Service responds to /health
- [ ] Frontend loads in browser
- [ ] PostgreSQL connected
- [ ] Redis connected

### **✅ Core Features Working**
- [ ] User signup
- [ ] User login
- [ ] Google OAuth
- [ ] Create field (with AI boundary)
- [ ] View field health
- [ ] View recommendations
- [ ] Browse news
- [ ] Push notifications enabled

### **✅ URLs Documented**
- [ ] Backend: `https://________________`
- [ ] ML Service: `https://________________`
- [ ] Frontend: `https://________________`
- [ ] PostgreSQL: `postgresql://________________`
- [ ] Redis: `redis://________________`

### **✅ Credentials Saved**
- [ ] JWT_SECRET saved in password manager
- [ ] ML_INTERNAL_TOKEN saved
- [ ] Google OAuth credentials saved
- [ ] Database credentials saved (Railway dashboard)

---

## 🎉 SUCCESS CRITERIA

**✅ Staging Deployment Complete When:**

1. All 3 services deployed and accessible via HTTPS
2. User can signup/login via email or Google
3. User can create a field with AI boundary detection
4. User can view field details and health data
5. All pages load without errors (check browser console)
6. API response times <2s for all endpoints
7. No 500 errors in logs
8. Database contains test data

**If all ✅ above: STAGING DEPLOYMENT SUCCESSFUL! 🎊**

---

## 📈 MONITORING SETUP

### **Railway Dashboard Monitoring**

**Backend Metrics:**
- CPU usage: <50%
- Memory usage: <512MB
- Response time: <500ms
- Uptime: >99%

**ML Service Metrics:**
- Memory usage: <1GB
- Response time: <2s (predictions)
- Model load time: <10s

**View Logs:**
```bash
# Backend logs
railway logs --service backend

# ML logs
railway logs --service ml-service
```

---

## 💰 COST ESTIMATE

**Railway Free Tier:**
- Credit: $5.00
- Sufficient for: ~500 hours of runtime (3 services × 7 days)
- **Staging should cost: $0-2/month**

**When Free Tier Expires:**
- Upgrade to Hobby Plan: $5/month
- Or migrate to Render (also has free tier)

---

## 🚀 NEXT STEPS AFTER STAGING

1. **Share Staging URL** with team/stakeholders
2. **Run Performance Tests** (Lighthouse, 3G test)
3. **Security Review** (JWT, HTTPS, CORS)
4. **UAT Preparation** (recruit farmers, create test scenarios)
5. **Fix Bugs** found during testing
6. **Prepare Production Deployment** (same process, different env)

---

## 📚 USEFUL COMMANDS

```bash
# Railway CLI Cheatsheet

# View all services
railway status

# Check logs (live)
railway logs -f

# Open Railway dashboard
railway open

# Connect to database
railway connect postgres

# List environment variables
railway variables

# Set environment variable
railway variables set KEY=value

# Delete service
railway delete

# Redeploy service
railway up --detach
```

---

## 🆘 SUPPORT

**If Stuck:**
1. Check Railway logs: `railway logs`
2. Check Railway dashboard: https://railway.app/dashboard
3. Railway docs: https://docs.railway.app
4. Railway Discord: https://discord.gg/railway

**Common Commands:**
```bash
# Restart service
railway restart

# View service details
railway service

# Link different service
railway link
```

---

**✅ DEPLOYMENT COMPLETION TIME: ~3-4 hours**

**Ready to start? Let's do this! 🚀**

---

*Deployment Guide Created Using BMAD Methodology*  
*Generated: November 19, 2025*

