# 🚀 SkyCrop Production Deployment - Sequential Guide

**Complete Step-by-Step Deployment Workflow**  
**Target Architecture:**
- Backend API → Railway
- PostgreSQL + PostGIS → Railway
- Redis → Railway
- Web Dashboard → Vercel
- Mobile App (Android) → Expo EAS Build

**Total Estimated Time:** 4-6 hours (first deployment)

---

## 📋 **TABLE OF CONTENTS**

1. [Prerequisites & Preparation](#phase-0-prerequisites--preparation)
2. [Railway Deployment (Backend + Database)](#phase-1-railway-deployment)
3. [Vercel Deployment (Web Dashboard)](#phase-2-vercel-deployment)
4. [Expo Deployment (Mobile App)](#phase-3-expo-deployment)
5. [Domain Configuration](#phase-4-domain-configuration)
6. [Final Testing](#phase-5-final-testing)
7. [Post-Deployment Setup](#phase-6-post-deployment-setup)

---

## ⏱️ **DEPLOYMENT TIMELINE**

```
Phase 0: Prerequisites         → 30 minutes
Phase 1: Railway Setup         → 60 minutes
Phase 2: Vercel Setup          → 30 minutes
Phase 3: Expo Setup            → 45 minutes
Phase 4: Domain Setup          → 30 minutes
Phase 5: Testing               → 45 minutes
Phase 6: Post-Deployment       → 30 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Time: 4-5 hours
```

---

# PHASE 0: Prerequisites & Preparation

**Duration:** 30 minutes

## Step 0.1: Create Accounts (If Not Already Created)

### Railway Account
1. Go to: https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended)
4. **Free tier:** $5 credit/month (enough for small apps)
5. **Pro tier:** $20/month (recommended for production)

### Vercel Account
1. Go to: https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)
4. **Free tier:** Unlimited personal projects ✅

### Expo Account
1. Go to: https://expo.dev
2. Click "Sign Up"
3. Create account (email or GitHub)
4. **Free tier:** 30 builds/month ✅

### Domain (Optional but Recommended)
1. Buy from: Namecheap, GoDaddy, or Cloudflare
2. Suggested: `skycrop.io` or `skycrop.app`
3. **Cost:** $10-15/year

---

## Step 0.2: Prepare Your Codebase

### 1. Ensure Clean Repository

```bash
cd D:\FYP\SkyCrop

# Check git status
git status

# Commit any uncommitted changes
git add .
git commit -m "Prepare for production deployment"

# Push to GitHub
git push origin main
```

### 2. Create Production Branch (Optional)

```bash
# Create production branch
git checkout -b production
git push -u origin production

# This keeps main for development, production for deployment
```

### 3. Verify Project Structure

```
D:\FYP\SkyCrop\
├── backend/
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── ...
├── mobile/
│   ├── src/
│   ├── package.json
│   ├── app.json
│   └── ...
└── README.md
```

---

## Step 0.3: Prepare Environment Variables Template

Create a document to track all your production values:

**File: `deployment_config.txt`** (Keep this PRIVATE!)

```
# ============================================
# SKYCROP PRODUCTION CONFIGURATION
# ============================================
# DO NOT COMMIT THIS FILE TO GIT!
# ============================================

# ============ RAILWAY (Backend) ============
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://user:pass@host:port
BACKEND_URL=https://skycrop-backend-xxx.up.railway.app
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
PORT=3000

# ============ VERCEL (Frontend) ============
VITE_API_BASE_URL=https://skycrop-backend-xxx.up.railway.app/api/v1
VITE_WS_URL=wss://skycrop-backend-xxx.up.railway.app
FRONTEND_URL=https://skycrop.vercel.app

# ============ EXPO (Mobile) ============
API_BASE_URL=https://skycrop-backend-xxx.up.railway.app/api/v1
WS_URL=wss://skycrop-backend-xxx.up.railway.app

# ============ DOMAIN ============
DOMAIN=skycrop.yourdomain.com
```

**✅ Phase 0 Complete!** → Move to Phase 1

---

# PHASE 1: Railway Deployment (Backend + Database)

**Duration:** 60 minutes

Railway will host:
- PostgreSQL + PostGIS database
- Redis cache
- Node.js backend API
- WebSocket server

---

## Step 1.1: Create New Railway Project

1. **Go to:** https://railway.app/dashboard
2. **Click:** "New Project"
3. **Select:** "Deploy from GitHub repo"
4. **Connect:** Your GitHub account (if not already)
5. **Select:** Your `SkyCrop` repository
6. **Branch:** Select `main` or `production`

Railway will detect your monorepo structure.

---

## Step 1.2: Add PostgreSQL Database

1. **In Railway Dashboard:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Wait for provisioning (~30 seconds)

2. **Enable PostGIS Extension:**
   - Click on PostgreSQL service
   - Go to "Query" tab
   - Run this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

3. **Get Connection String:**
   - Click "Connect" tab
   - Copy "DATABASE_URL" value
   - Example: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:7432/railway`
   - **Save this in your `deployment_config.txt`**

---

## Step 1.3: Add Redis

1. **In Railway Dashboard:**
   - Click "New" → "Database" → "Add Redis"
   - Wait for provisioning (~30 seconds)

2. **Get Connection String:**
   - Click on Redis service
   - Go to "Connect" tab
   - Copy "REDIS_URL" value
   - Example: `redis://default:pass@containers-us-west-xxx.railway.app:6379`
   - **Save this in your `deployment_config.txt`**

---

## Step 1.4: Configure Backend Service

1. **Add Backend Service:**
   - Railway should auto-detect your `backend/` folder
   - If not, click "New" → "GitHub Repo" → Select SkyCrop
   - Set **Root Directory:** `backend`

2. **Configure Build Settings:**
   - Click on Backend service
   - Go to "Settings" tab
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build` (if you have build script)
   - **Start Command:** `npm start` or `node src/server.js`
   - **Watch Paths:** `backend/**`

3. **Add Environment Variables:**
   - Go to "Variables" tab
   - Click "Raw Editor"
   - Paste these (replace with your actual values):

```env
NODE_ENV=production
PORT=3000

# Database (from Step 1.2)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (from Step 1.3)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# CORS Origins (will update after Vercel deployment)
CORS_ORIGINS=https://skycrop.vercel.app,http://localhost:5173

# App URLs (will update after domain setup)
FRONTEND_URL=https://skycrop.vercel.app
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Email (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS S3 (if using image uploads)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=skycrop-images

# ML Service (if using ML features)
ML_SERVICE_URL=http://ml-service:5000
```

4. **Railway Variables Syntax:**
   - `${{Postgres.DATABASE_URL}}` → Auto-references PostgreSQL service
   - `${{Redis.REDIS_URL}}` → Auto-references Redis service
   - `${{RAILWAY_PUBLIC_DOMAIN}}` → Auto-generated public URL

---

## Step 1.5: Deploy Backend

1. **Trigger Deployment:**
   - Railway automatically deploys on git push
   - Or click "Deploy" button manually

2. **Monitor Build Logs:**
   - Click on Backend service
   - Go to "Deployments" tab
   - Click on latest deployment
   - Watch build logs (2-5 minutes)

3. **Check for Errors:**
   - Build should succeed
   - Service should be "Active" (green)

4. **Get Public URL:**
   - Click "Settings" → "Networking"
   - Click "Generate Domain"
   - You get: `skycrop-backend-production-xxxx.up.railway.app`
   - **Save this in `deployment_config.txt`**

---

## Step 1.6: Run Database Migrations

**Option A: Using Railway CLI**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
cd D:\FYP\SkyCrop\backend
railway link

# Run migrations
railway run npm run migrate

# Or seed database
railway run npm run seed
```

**Option B: Using Railway Shell**

1. Go to Backend service in Railway
2. Click "Settings" → "Shell"
3. Run commands:

```bash
npm run migrate
npm run seed
```

**Option C: Connect Locally**

```bash
cd D:\FYP\SkyCrop\backend

# Set DATABASE_URL from Railway
$env:DATABASE_URL="postgresql://postgres:pass@containers-us-west-xxx.railway.app:7432/railway"

# Run migrations locally (connects to Railway DB)
npm run migrate
```

---

## Step 1.7: Verify Backend Deployment

**Test Health Endpoint:**

1. Open browser or Postman
2. Go to: `https://your-backend-url.up.railway.app/api/v1/health`
3. Should see:

```json
{
  "status": "ok",
  "timestamp": "2024-11-22T10:30:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

**Test API Endpoint:**

```bash
# Test with curl
curl https://your-backend-url.up.railway.app/api/v1/health

# Or open in browser
```

**✅ Phase 1 Complete!** → Move to Phase 2

---

# PHASE 2: Vercel Deployment (Web Dashboard)

**Duration:** 30 minutes

Vercel will host your React frontend (Vite app).

---

## Step 2.1: Prepare Frontend for Production

### 1. Update Environment Variables

**File: `frontend/.env.production`** (create if doesn't exist)

```env
# Use your Railway backend URL from Phase 1
VITE_API_BASE_URL=https://skycrop-backend-production-xxxx.up.railway.app/api/v1
VITE_WS_URL=wss://skycrop-backend-production-xxxx.up.railway.app

# App Info
VITE_APP_NAME=SkyCrop
VITE_APP_VERSION=1.0.0
VITE_ENV=production
```

### 2. Verify Build Configuration

**File: `frontend/package.json`**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**File: `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false // Disable for production
  }
})
```

### 3. Test Build Locally

```bash
cd D:\FYP\SkyCrop\frontend

# Install dependencies
npm install

# Build for production
npm run build

# Test production build
npm run preview
```

Should see: `Local: http://localhost:4173/`

---

## Step 2.2: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to:** https://vercel.com/dashboard
2. **Click:** "Add New..." → "Project"
3. **Import Git Repository:**
   - Select your GitHub `SkyCrop` repository
   - Click "Import"

4. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Environment Variables:**
   - Click "Environment Variables"
   - Add:

```
VITE_API_BASE_URL=https://skycrop-backend-production-xxxx.up.railway.app/api/v1
VITE_WS_URL=wss://skycrop-backend-production-xxxx.up.railway.app
```

6. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build

7. **Get Deployment URL:**
   - You get: `skycrop.vercel.app` or `skycrop-[random].vercel.app`
   - **Save this in `deployment_config.txt`**

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd D:\FYP\SkyCrop\frontend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Scope: Your account
# - Link to existing project? No
# - Project name: skycrop
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

---

## Step 2.3: Configure Custom Domain (Optional)

**If you have a domain (e.g., `app.skycrop.com`):**

1. **In Vercel Dashboard:**
   - Go to Project Settings
   - Click "Domains"
   - Enter your domain: `app.skycrop.com`
   - Click "Add"

2. **Configure DNS:**
   - Go to your domain registrar (Namecheap, GoDaddy, etc.)
   - Add CNAME record:

```
Type:  CNAME
Name:  app
Value: cname.vercel-dns.com
TTL:   Automatic
```

3. **Wait for DNS propagation (5-60 minutes)**

4. **Vercel auto-issues SSL certificate** ✅

---

## Step 2.4: Update Railway CORS Settings

Now that you have a Vercel URL, update Railway backend:

1. **Go to Railway Dashboard**
2. **Click on Backend service**
3. **Go to "Variables" tab**
4. **Update `CORS_ORIGINS`:**

```env
CORS_ORIGINS=https://skycrop.vercel.app,https://app.skycrop.com,http://localhost:5173
```

5. **Railway automatically redeploys** (30 seconds)

---

## Step 2.5: Verify Frontend Deployment

1. **Open:** `https://skycrop.vercel.app`
2. **Check:**
   - Page loads ✅
   - No console errors ✅
   - Can navigate pages ✅

3. **Test API Connection:**
   - Try to login
   - Should connect to Railway backend ✅

**✅ Phase 2 Complete!** → Move to Phase 3

---

# PHASE 3: Expo Deployment (Mobile App)

**Duration:** 45 minutes

Deploy Android app via Expo EAS Build.

---

## Step 3.1: Install Expo CLI & EAS CLI

```bash
# Install globally
npm install -g expo-cli eas-cli

# Verify installation
expo --version
eas --version
```

---

## Step 3.2: Login to Expo

```bash
# Login (creates account if needed)
eas login

# Or create account first at: https://expo.dev
```

---

## Step 3.3: Configure Mobile App

### 1. Update app.json

**File: `mobile/app.json`**

```json
{
  "expo": {
    "name": "SkyCrop",
    "slug": "skycrop",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/[your-project-id]"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "android": {
      "package": "com.yourcompany.skycrop",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID_HERE"
      }
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

### 2. Create/Update Environment Config

**File: `mobile/src/config/env.ts`** (or wherever your config is)

```typescript
// Production configuration
export const ENV = {
  API_BASE_URL: 'https://skycrop-backend-production-xxxx.up.railway.app/api/v1',
  WS_URL: 'wss://skycrop-backend-production-xxxx.up.railway.app',
  ENV: 'production',
  APP_VERSION: '1.0.0'
};

// Or use environment variables
export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000',
  ENV: process.env.EXPO_PUBLIC_ENV || 'development',
  APP_VERSION: '1.0.0'
};
```

---

## Step 3.4: Initialize EAS

```bash
cd D:\FYP\SkyCrop\mobile

# Initialize EAS
eas build:configure

# This creates eas.json
```

### Configure eas.json

**File: `mobile/eas.json`**

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug",
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://skycrop-backend-production-xxxx.up.railway.app/api/v1",
        "EXPO_PUBLIC_WS_URL": "wss://skycrop-backend-production-xxxx.up.railway.app",
        "EXPO_PUBLIC_ENV": "production"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://skycrop-backend-production-xxxx.up.railway.app/api/v1",
        "EXPO_PUBLIC_WS_URL": "wss://skycrop-backend-production-xxxx.up.railway.app",
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Step 3.5: Configure App Assets

### 1. Create App Icon

**Requirements:**
- Size: 1024x1024 px
- Format: PNG
- No transparency (for adaptive icon)

**File: `mobile/assets/icon.png`**

You can use:
- Figma/Canva to design
- Or placeholder: https://via.placeholder.com/1024

### 2. Create Splash Screen

**Requirements:**
- Size: 1284x2778 px (iPhone 14 Pro Max)
- Format: PNG
- Centered logo

**File: `mobile/assets/splash.png`**

### 3. Create Adaptive Icon (Android)

**File: `mobile/assets/adaptive-icon.png`**
- Size: 1024x1024 px
- Foreground image (logo)

---

## Step 3.6: Build Android APK

### Preview Build (For Testing)

```bash
cd D:\FYP\SkyCrop\mobile

# Build preview APK
eas build --platform android --profile preview

# Follow prompts:
# - Generate new keystore? Yes (first time)
# - Keystore password? (create one, save it!)

# Build starts on Expo servers...
# Wait 10-15 minutes ☕
```

**Output:**
```
✅ Build finished
📦 https://expo.dev/artifacts/eas/abc123xyz.apk

Download and install this APK on Android devices!
```

### Production Build

```bash
cd D:\FYP\SkyCrop\mobile

# Build production APK
eas build --platform android --profile production

# Wait 10-20 minutes ☕
```

---

## Step 3.7: Download & Test APK

1. **Get Download Link:**
   - Expo sends link to your email
   - Or go to: https://expo.dev/accounts/[username]/projects/skycrop/builds

2. **Test on Real Android Device:**
   - Transfer APK to phone via USB or download link
   - Enable "Install Unknown Apps" permission
   - Install APK
   - Open app and test all features

3. **Common Issues:**
   - **Cannot install:** Check "Unknown Sources" permission
   - **App crashes:** Check build logs in Expo dashboard
   - **Network errors:** Verify Railway backend URL in `env.ts`

---

## Step 3.8: Set Up OTA Updates (Optional)

Enable over-the-air updates (users get updates without reinstalling):

```bash
cd D:\FYP\SkyCrop\mobile

# Configure updates
eas update:configure

# Publish update
eas update --branch production --message "Initial production release"

# Users automatically get updates! 🔄
```

**To push updates later:**

```bash
# Make code changes...
# Then publish update:
eas update --branch production --message "Bug fixes and improvements"

# Users get updates on next app launch!
```

---

## Step 3.9: Create Download Page

Host your APK download on Vercel (same project):

**File: `frontend/public/download.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download SkyCrop - Android App</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
    .logo { font-size: 4rem; margin-bottom: 1rem; }
    h1 { color: #2563eb; }
    .download-btn {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: bold;
      margin: 2rem 0;
      font-size: 1.2rem;
    }
    .download-btn:hover { background: #1d4ed8; }
    .steps {
      text-align: left;
      background: #f3f4f6;
      padding: 1.5rem;
      border-radius: 0.5rem;
      margin: 2rem 0;
    }
    .version { color: #6b7280; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="logo">🌾</div>
  <h1>Download SkyCrop for Android</h1>
  <p>Precision agriculture at your fingertips</p>
  
  <a href="https://expo.dev/artifacts/eas/YOUR-BUILD-ID.apk" class="download-btn">
    📥 Download APK (v1.0.0)
  </a>
  
  <div class="steps">
    <h3>📱 Installation Steps:</h3>
    <ol>
      <li>Click "Download APK" button above</li>
      <li>Wait for download to complete</li>
      <li>Open downloaded file</li>
      <li>If prompted, enable "Install Unknown Apps" for your browser</li>
      <li>Tap "Install"</li>
      <li>Open SkyCrop and start farming! 🚀</li>
    </ol>
  </div>
  
  <div class="version">
    <p><strong>Version:</strong> 1.0.0</p>
    <p><strong>Last Updated:</strong> November 22, 2024</p>
    <p><strong>Size:</strong> ~45 MB</p>
    <p><strong>Android:</strong> 6.0 and up</p>
  </div>
  
  <p style="margin-top: 3rem;">
    <a href="/">← Back to Dashboard</a>
  </p>
</body>
</html>
```

**Access at:** `https://skycrop.vercel.app/download.html`

**✅ Phase 3 Complete!** → Move to Phase 4

---

# PHASE 4: Domain Configuration (Optional)

**Duration:** 30 minutes

Set up custom domain for professional URLs.

---

## Step 4.1: Purchase Domain (If Not Already Done)

**Recommended Registrars:**
- Namecheap: https://namecheap.com
- Cloudflare: https://cloudflare.com
- GoDaddy: https://godaddy.com

**Example:** Buy `skycrop.io` for $12/year

---

## Step 4.2: Configure DNS Records

### Target URLs:
```
skycrop.io                    → Web Dashboard (Vercel)
app.skycrop.io                → Web Dashboard (Vercel)
api.skycrop.io                → Backend API (Railway)
download.skycrop.io           → APK Download Page (Vercel)
```

### DNS Configuration:

**In your domain registrar's DNS settings:**

```
# Root domain → Vercel
Type:  A
Name:  @
Value: 76.76.21.21
TTL:   Automatic

# www subdomain → Vercel
Type:  CNAME
Name:  www
Value: cname.vercel-dns.com
TTL:   Automatic

# app subdomain → Vercel
Type:  CNAME
Name:  app
Value: cname.vercel-dns.com
TTL:   Automatic

# API subdomain → Railway
Type:  CNAME
Name:  api
Value: skycrop-backend-production-xxxx.up.railway.app
TTL:   Automatic

# Download subdomain → Vercel
Type:  CNAME
Name:  download
Value: cname.vercel-dns.com
TTL:   Automatic
```

---

## Step 4.3: Configure Vercel Domain

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Settings → Domains**
4. **Add domains:**
   - `skycrop.io`
   - `app.skycrop.io`
   - `download.skycrop.io`

5. **Vercel auto-configures SSL** (Let's Encrypt) ✅

---

## Step 4.4: Configure Railway Domain

1. **Go to Railway Dashboard**
2. **Select Backend service**
3. **Settings → Networking**
4. **Custom Domain:**
   - Enter: `api.skycrop.io`
   - Click "Add Domain"

5. **Railway auto-configures SSL** ✅

---

## Step 4.5: Update Environment Variables

### Update Railway Backend:

```env
FRONTEND_URL=https://app.skycrop.io
BACKEND_URL=https://api.skycrop.io
CORS_ORIGINS=https://skycrop.io,https://app.skycrop.io,https://download.skycrop.io
```

### Update Vercel Frontend:

```env
VITE_API_BASE_URL=https://api.skycrop.io/api/v1
VITE_WS_URL=wss://api.skycrop.io
```

### Update Mobile App:

**File: `mobile/eas.json`**

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api.skycrop.io/api/v1",
        "EXPO_PUBLIC_WS_URL": "wss://api.skycrop.io"
      }
    }
  }
}
```

**Rebuild mobile app:**

```bash
cd mobile
eas build --platform android --profile production
```

---

## Step 4.6: Wait for DNS Propagation

- **Time:** 5 minutes - 48 hours (usually 15-30 minutes)
- **Check:** https://dnschecker.org

---

## Step 4.7: Verify Domain Setup

**Test each URL:**

```
✅ https://skycrop.io               → Web Dashboard
✅ https://app.skycrop.io           → Web Dashboard
✅ https://api.skycrop.io/health    → Backend Health
✅ https://download.skycrop.io      → APK Download
```

**✅ Phase 4 Complete!** → Move to Phase 5

---

# PHASE 5: Final Testing

**Duration:** 45 minutes

Comprehensive testing of all deployed services.

---

## Step 5.1: Test Backend API

### Health Check

```bash
curl https://api.skycrop.io/api/v1/health

# Expected:
{
  "status": "ok",
  "timestamp": "2024-11-22T...",
  "database": "connected",
  "redis": "connected"
}
```

### Test Authentication

```bash
# Register user
curl -X POST https://api.skycrop.io/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User"
  }'

# Login
curl -X POST https://api.skycrop.io/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Should return JWT token
```

### Test Database Connection

```bash
# List fields (needs auth token)
curl https://api.skycrop.io/api/v1/fields \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Step 5.2: Test Web Dashboard

### Manual Testing Checklist:

**1. Open:** `https://app.skycrop.io`

**2. Test Authentication:**
- [ ] Register new account
- [ ] Login with credentials
- [ ] JWT token stored in localStorage
- [ ] Redirect to dashboard

**3. Test Navigation:**
- [ ] Dashboard page loads
- [ ] Fields page accessible
- [ ] Analytics page accessible
- [ ] Recommendations page accessible
- [ ] Settings page accessible

**4. Test API Integration:**
- [ ] Fields list loads from backend
- [ ] Create new field
- [ ] Edit field
- [ ] Delete field
- [ ] View field details

**5. Test Real-time Features:**
- [ ] WebSocket connects (check browser console)
- [ ] Notifications appear
- [ ] Live updates work

**6. Test UI Components:**
- [ ] Maps render (Leaflet)
- [ ] Charts render (Recharts)
- [ ] Modals open/close
- [ ] Forms validate
- [ ] Loading states show

**7. Test Responsive Design:**
- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)

**8. Test Performance:**
- [ ] Page load < 3 seconds
- [ ] Smooth scrolling
- [ ] No console errors
- [ ] No memory leaks

---

## Step 5.3: Test Mobile App

### Manual Testing Checklist:

**1. Install APK** on Android device

**2. Test Authentication:**
- [ ] Register new account
- [ ] Login with credentials
- [ ] Token persistence (stays logged in)
- [ ] Logout works

**3. Test Navigation:**
- [ ] Bottom navigation works
- [ ] Stack navigation works
- [ ] Back button works
- [ ] Deep linking (if implemented)

**4. Test Core Features:**
- [ ] Fields list loads
- [ ] Map view works (React Native Maps)
- [ ] Camera access works
- [ ] Location access works
- [ ] Image upload works
- [ ] Notifications work (FCM)

**5. Test Real-time Features:**
- [ ] WebSocket connects
- [ ] Live notifications
- [ ] Data syncs with web dashboard

**6. Test Offline Mode:**
- [ ] Enable airplane mode
- [ ] App doesn't crash
- [ ] Shows offline message
- [ ] Data cached locally

**7. Test Performance:**
- [ ] App starts < 2 seconds
- [ ] Smooth animations (60fps)
- [ ] No crashes
- [ ] Battery usage acceptable

**8. Test Edge Cases:**
- [ ] Poor network connection
- [ ] Kill app and reopen
- [ ] Multiple rapid requests
- [ ] Large datasets

---

## Step 5.4: Test Integration Between Services

### Test Cross-Platform Sync:

**Scenario:** Update field on web, see on mobile

1. Login to web dashboard (`app.skycrop.io`)
2. Create new field "Test Field"
3. Open mobile app (logged in same account)
4. Refresh fields list
5. **Expected:** "Test Field" appears ✅

**Scenario:** Upload image on mobile, see on web

1. Open mobile app
2. Take photo of field
3. Upload to field
4. Open web dashboard
5. Navigate to same field
6. **Expected:** Image visible ✅

---

## Step 5.5: Load Testing (Optional)

### Simple Load Test:

```bash
# Install Apache Bench
# Windows: Download from Apache website
# Or use online service: loader.io

# Test backend
ab -n 1000 -c 10 https://api.skycrop.io/api/v1/health

# -n 1000: 1000 requests
# -c 10: 10 concurrent

# Check results:
# - Requests per second
# - Average response time
# - Failed requests (should be 0)
```

**Expected Performance:**
- Response time: < 200ms
- Throughput: > 100 req/sec
- Error rate: 0%

---

## Step 5.6: Security Testing

### Basic Security Checks:

**1. HTTPS Enabled:**
```bash
# All URLs should use HTTPS
curl -I https://api.skycrop.io
# Should see: HTTP/2 200
```

**2. CORS Configured:**
```bash
# Test CORS headers
curl -H "Origin: https://app.skycrop.io" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.skycrop.io/api/v1/auth/login

# Should see:
# Access-Control-Allow-Origin: https://app.skycrop.io
```

**3. JWT Authentication:**
```bash
# Test without token (should fail)
curl https://api.skycrop.io/api/v1/fields
# Expected: 401 Unauthorized

# Test with invalid token (should fail)
curl https://api.skycrop.io/api/v1/fields \
     -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized
```

**4. SQL Injection Protection:**
- Try login with: `' OR '1'='1`
- Should fail gracefully

**5. XSS Protection:**
- Try entering: `<script>alert('xss')</script>` in forms
- Should be sanitized

---

## Step 5.7: Browser Compatibility Testing

**Test on:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Test mobile browsers:**
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Samsung Internet

---

## Step 5.8: Create Test Report

**Document results:**

```markdown
# SkyCrop Production Testing Report
Date: November 22, 2024

## Backend API (Railway)
✅ Health endpoint: OK
✅ Authentication: OK
✅ Database queries: OK
✅ WebSocket: OK
✅ Performance: 150ms avg response time

## Web Dashboard (Vercel)
✅ Authentication flow: OK
✅ All pages load: OK
✅ API integration: OK
✅ Real-time features: OK
✅ Performance: 2.1s page load

## Mobile App (Expo)
✅ Installation: OK
✅ Authentication: OK
✅ Core features: OK
✅ Camera/Location: OK
✅ Performance: 1.8s startup

## Cross-Platform Sync
✅ Web → Mobile sync: OK
✅ Mobile → Web sync: OK
✅ Real-time updates: OK

## Security
✅ HTTPS: Enabled
✅ JWT Auth: Working
✅ CORS: Configured
✅ SQL Injection: Protected

## Issues Found
- None (or list issues)

## Recommendation
✅ READY FOR PRODUCTION
```

**✅ Phase 5 Complete!** → Move to Phase 6

---

# PHASE 6: Post-Deployment Setup

**Duration:** 30 minutes

Final configurations and monitoring setup.

---

## Step 6.1: Set Up Error Tracking (Sentry)

### Why Sentry?
- Catch production errors
- Get alerts when things break
- Track performance issues
- Free tier: 5,000 errors/month

### Setup:

1. **Create Sentry Account:**
   - Go to: https://sentry.io
   - Sign up (free)

2. **Create Projects:**
   - Backend (Node.js)
   - Frontend (React)
   - Mobile (React Native)

3. **Install Sentry:**

**Backend:**
```bash
cd backend
npm install @sentry/node
```

**File: `backend/src/config/sentry.js`**
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

module.exports = Sentry;
```

**Frontend:**
```bash
cd frontend
npm install @sentry/react
```

**File: `frontend/src/config/sentry.ts`**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENV,
  tracesSampleRate: 1.0,
});
```

4. **Add to Environment Variables:**

Railway:
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

Vercel:
```env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## Step 6.2: Set Up Uptime Monitoring

### Option A: UptimeRobot (Free)

1. **Go to:** https://uptimerobot.com
2. **Create account** (free)
3. **Add monitors:**
   - `https://api.skycrop.io/health` (every 5 min)
   - `https://app.skycrop.io` (every 5 min)

4. **Set up alerts:**
   - Email notifications
   - SMS (if important)

### Option B: Railway Built-in Monitoring

Railway has built-in health checks:

1. Go to service settings
2. Enable "Health Check"
3. Set path: `/health`
4. Interval: 60 seconds

---

## Step 6.3: Set Up Analytics (Optional)

### Google Analytics 4:

1. **Create GA4 Property:**
   - https://analytics.google.com
   - Create new property

2. **Add to Frontend:**

```bash
cd frontend
npm install react-ga4
```

**File: `frontend/src/config/analytics.ts`**
```typescript
import ReactGA from 'react-ga4';

export const initGA = () => {
  ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID);
};

export const logPageView = () => {
  ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
};
```

3. **Track Events:**
```typescript
ReactGA.event({
  category: 'User',
  action: 'Created Field'
});
```

---

## Step 6.4: Create Admin User

**Create first admin user in production:**

```bash
# Connect to Railway
railway link

# Run seed script
railway run node src/scripts/createAdmin.js
```

**Or use Railway shell:**

1. Railway Dashboard → Backend service → Shell
2. Run:

```bash
node src/scripts/createAdmin.js
```

**Or insert directly into database:**

```sql
INSERT INTO users (email, password, name, role, status)
VALUES (
  'admin@skycrop.com',
  '$2b$10$hashedpassword',  -- Hash "admin123" with bcrypt
  'Admin User',
  'admin',
  'active'
);
```

---

## Step 6.5: Set Up Backups

### Database Backups (Railway):

**Railway Pro plan includes:**
- Daily automated backups
- 7-day retention
- One-click restore

**Manual backup:**

```bash
# Install Railway CLI
railway link

# Backup database
railway run pg_dump > backup-$(date +%Y%m%d).sql

# Or schedule with cron/task scheduler
```

### Store Backups:
- AWS S3
- Google Cloud Storage
- Dropbox
- GitHub private repo (not ideal but works)

---

## Step 6.6: Create Runbook

**Document common operations:**

**File: `RUNBOOK.md`**

```markdown
# SkyCrop Production Runbook

## 🚨 Emergency Contacts
- Tech Lead: your-email@domain.com
- DevOps: devops@domain.com

## 🔗 Important Links
- Web Dashboard: https://app.skycrop.io
- Backend API: https://api.skycrop.io
- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Expo Dashboard: https://expo.dev/accounts/[username]/projects/skycrop
- Sentry: https://sentry.io
- UptimeRobot: https://uptimerobot.com

## 🔧 Common Tasks

### Deploy New Backend Version
1. Push to GitHub main branch
2. Railway auto-deploys (2-3 min)
3. Monitor logs in Railway dashboard

### Deploy New Frontend Version
1. Push to GitHub main branch
2. Vercel auto-deploys (1-2 min)
3. Check https://app.skycrop.io

### Deploy New Mobile Version
1. Update version in app.json
2. Run: `eas build --platform android --profile production`
3. Update download link on website

### Push Mobile OTA Update
1. Make JS-only changes
2. Run: `eas update --branch production --message "..."`
3. Users get update on next app launch

### Database Migration
1. Create migration file
2. Railway CLI: `railway run npm run migrate`
3. Verify in Railway logs

### Rollback Deployment
**Railway:**
- Dashboard → Deployments → Select previous → "Redeploy"

**Vercel:**
- Dashboard → Deployments → Select previous → "Promote to Production"

### View Logs
**Railway:**
- Dashboard → Service → Logs tab

**Vercel:**
- Dashboard → Project → Functions tab

### Scale Resources
**Railway:**
- Dashboard → Service → Settings → Resources
- Adjust CPU/Memory

## 🚨 Troubleshooting

### Backend Down
1. Check Railway status: https://status.railway.app
2. Check logs in Railway dashboard
3. Check Sentry for errors
4. Verify database connection
5. Restart service if needed

### Frontend Down
1. Check Vercel status: https://vercel-status.com
2. Check build logs
3. Verify environment variables
4. Redeploy if needed

### Mobile App Not Working
1. Check backend API health
2. Verify app version
3. Check Sentry for crashes
4. Test network connectivity
5. Reinstall app

### Database Issues
1. Check Railway PostgreSQL service
2. Check connection string
3. Verify disk space
4. Check active connections
5. Restart database if needed

### High Error Rate
1. Check Sentry for specific errors
2. Check Railway logs
3. Check recent deployments
4. Rollback if necessary

## 📊 Monitoring Dashboards
- Railway: Real-time logs and metrics
- Sentry: Error tracking
- UptimeRobot: Uptime monitoring
- Google Analytics: User analytics
```

---

## Step 6.7: Set Up CI/CD (Optional but Recommended)

**Automate testing before deployment:**

**File: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test
      - run: cd frontend && npm run build

  deploy:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Notification
        run: echo "Tests passed! Railway and Vercel will auto-deploy."
```

---

## Step 6.8: Document Credentials

**Create PRIVATE document (DO NOT COMMIT TO GIT!):**

**File: `production_credentials.txt`** (keep in password manager)

```
# ============================================
# SKYCROP PRODUCTION CREDENTIALS
# ============================================
# KEEP THIS FILE SECURE AND PRIVATE!
# ============================================

# Railway
Account: your-email@domain.com
Password: (use password manager)
Project ID: xxx-xxx-xxx

# Vercel
Account: your-email@domain.com
Password: (use password manager)
Project: skycrop

# Expo
Account: your-email@domain.com
Password: (use password manager)
Project ID: xxx-xxx-xxx

# Database
Railway PostgreSQL URL: postgresql://...
Direct Access: (Railway dashboard)

# Redis
Railway Redis URL: redis://...

# Domain Registrar
Registrar: Namecheap
Account: your-email@domain.com
Password: (use password manager)

# Sentry
Account: your-email@domain.com
Password: (use password manager)
DSN: https://...

# Admin Access
Email: admin@skycrop.com
Password: (strong password)

# API Keys (if any)
AWS Access Key: xxx
AWS Secret Key: xxx
Google Maps API: xxx
```

**Store in:**
- LastPass
- 1Password
- Bitwarden
- Or encrypted document

---

**✅ Phase 6 Complete!** → DEPLOYMENT FINISHED! 🎉

---

# 🎉 DEPLOYMENT COMPLETE CHECKLIST

## Verify Everything is Running:

- [ ] **Backend API (Railway)**
  - https://api.skycrop.io/health returns 200 OK
  - Database connected
  - Redis connected
  - WebSocket working

- [ ] **Web Dashboard (Vercel)**
  - https://app.skycrop.io loads
  - Login works
  - All pages accessible
  - API calls successful

- [ ] **Mobile App (Expo)**
  - APK downloadable
  - App installs on Android
  - Login works
  - All features functional

- [ ] **Domain Configuration**
  - DNS records configured
  - SSL certificates active
  - All subdomains working

- [ ] **Monitoring & Alerts**
  - Sentry tracking errors
  - Uptime monitoring active
  - Alerts configured

- [ ] **Documentation**
  - Runbook created
  - Credentials secured
  - Team notified

---

# 📊 PRODUCTION URLS

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 MOBILE APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Download: https://download.skycrop.io
APK Link: https://expo.dev/artifacts/eas/[build-id].apk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 WEB DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Production: https://app.skycrop.io
Vercel: https://skycrop.vercel.app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔌 BACKEND API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Production: https://api.skycrop.io
Health: https://api.skycrop.io/health
Railway: https://skycrop-backend-production-xxx.up.railway.app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ADMIN DASHBOARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Railway: https://railway.app/dashboard
Vercel: https://vercel.com/dashboard
Expo: https://expo.dev/accounts/[username]/projects/skycrop
Sentry: https://sentry.io
```

---

# 🚀 WHAT'S NEXT?

## Immediate (Week 1):
- [ ] Monitor error rates in Sentry
- [ ] Check uptime in UptimeRobot
- [ ] Gather user feedback
- [ ] Fix any critical bugs

## Short-term (Month 1):
- [ ] Set up automated database backups
- [ ] Implement proper logging
- [ ] Add more monitoring metrics
- [ ] Optimize performance
- [ ] A/B testing setup

## Long-term (Month 2-3):
- [ ] Google Play Store submission
- [ ] iOS app development
- [ ] Advanced analytics
- [ ] Auto-scaling setup
- [ ] Load balancer configuration

---

# 💰 MONTHLY COSTS

```
Service                  Cost         Notes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Railway (Backend)        $10-20       Includes DB + Redis
Vercel (Frontend)        $0           Free tier
Expo (Mobile)            $0           Free tier (30 builds/month)
Domain                   $1           $12/year
Sentry                   $0           Free tier
UptimeRobot             $0           Free tier
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL                    $11-21/month

With Google Play:        +$25 one-time
With iOS (future):       +$99/year
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 📚 ADDITIONAL RESOURCES

## Documentation:
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Expo: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction

## Support:
- Railway Discord: https://discord.gg/railway
- Vercel Discord: https://vercel.com/discord
- Expo Discord: https://chat.expo.dev

## Tutorials:
- Railway Deploy: https://railway.app/templates
- Vercel Deploy: https://vercel.com/guides
- Expo Publish: https://docs.expo.dev/eas-update/introduction

---

# 🎓 LESSONS LEARNED

**What Worked Well:**
✅ Railway made backend deployment super easy
✅ Vercel auto-deploy from GitHub saved time
✅ Expo eliminated need for Play Store initially
✅ Free tiers kept costs low

**What to Improve:**
⚠️ Need better error handling in production
⚠️ Add more comprehensive logging
⚠️ Implement rate limiting
⚠️ Add request caching

**Tips for Future Deployments:**
💡 Test thoroughly in staging first
💡 Use environment variables for everything
💡 Document every step
💡 Set up monitoring BEFORE launch
💡 Have rollback plan ready

---

# 🏆 CONGRATULATIONS!

**Your SkyCrop project is now LIVE in production!** 🚀🌾

**Deployed Services:**
✅ Backend API on Railway
✅ PostgreSQL + PostGIS on Railway
✅ Redis on Railway
✅ Web Dashboard on Vercel
✅ Android App via Expo

**You now have:**
- Scalable backend infrastructure
- Professional web dashboard
- Installable Android app
- Real-time features
- Error tracking
- Uptime monitoring

**Users can:**
- Access web app at https://app.skycrop.io
- Download Android app from https://download.skycrop.io
- Use all features with production data

---

**Need help?** Review the RUNBOOK.md for common operations and troubleshooting! 

**Ready for Phase 3 of Sprint 5?** Let me know! 💪✨


