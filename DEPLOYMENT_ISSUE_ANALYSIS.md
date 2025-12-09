# 🔍 Deployment Issue Analysis - BMAD Method

## Executive Summary

**Issue:** Frontend deployed on Vercel cannot authenticate users - getting 404 errors for `/api/v1/auth/login` and `/api/v1/auth/signup`.

**Root Cause:** Frontend is configured to use relative API paths (`/api/v1`), causing requests to hit Vercel domain instead of Railway backend.

**Solution:** Set `VITE_API_BASE_URL` environment variable in Vercel pointing directly to Railway backend, and configure CORS on Railway.

---

## Problem Analysis

### Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend       │         │   ML Service    │
│   (Vercel)      │────────▶│   (Railway)     │────────▶│   (Railway)     │
│                 │         │                 │         │                 │
│ skycrop.vercel  │         │ backend-xxx.    │         │ ml-service-xxx. │
│      .app       │         │ railway.app     │         │ railway.app     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Current Configuration

1. **Frontend (`frontend/src/config/env.ts`):**
   - Default API base URL: `/api/v1` (relative path)
   - Falls back to relative path if `VITE_API_BASE_URL` is not set
   - Uses `import.meta.env.VITE_API_BASE_URL` in browser

2. **Vercel Configuration (`frontend/vercel.json`):**
   - Has rewrite rule to proxy `/api/v1/*` to Railway
   - Rewrite destination: `https://backend-production-9e94.up.railway.app/api/v1/$1`
   - **Issue:** Rewrite may not be working, or Railway URL is incorrect

3. **Backend (`backend/src/app.js`):**
   - CORS configured with `process.env.CORS_ORIGIN`
   - Defaults to `*` (allows all origins)
   - Auth routes exist: `/api/v1/auth/login`, `/api/v1/auth/signup`

### Error Flow

```
User clicks "Sign Up"
    ↓
Frontend makes request to: /api/v1/auth/signup
    ↓
Browser resolves to: https://skycrop.vercel.app/api/v1/auth/signup
    ↓
Vercel tries to rewrite/proxy to Railway
    ↓
❌ 404 Error (rewrite not working or Railway URL wrong)
```

### Why It's Failing

1. **Environment Variable Not Set:**
   - `VITE_API_BASE_URL` is not configured in Vercel
   - Frontend defaults to relative path `/api/v1`
   - Requests go to Vercel domain instead of Railway

2. **Vercel Rewrite Issues:**
   - Rewrite rule exists but may not be working
   - Railway URL in `vercel.json` might be incorrect
   - Rewrites can be unreliable for API proxying

3. **CORS Configuration:**
   - Backend may not have Vercel domain in `CORS_ORIGIN`
   - Even if rewrite works, CORS could block requests

---

## Solution Strategy

### Recommended Approach: Direct API URL

**Why:**
- ✅ Simpler configuration
- ✅ Better error messages
- ✅ No proxy overhead
- ✅ Easier debugging
- ✅ More reliable

**How:**
1. Set `VITE_API_BASE_URL` in Vercel environment variables
2. Point directly to Railway backend URL
3. Configure CORS on Railway to allow Vercel domain

### Alternative Approach: Fix Vercel Rewrite

**Why:**
- Can work if configured correctly
- Keeps API calls relative (simpler frontend code)

**How:**
1. Update `vercel.json` with correct Railway URL
2. Ensure rewrite rules work
3. Still need to configure CORS

---

## Implementation Steps

### Step 1: Get Railway Backend URL

```bash
# Option 1: Railway CLI
railway domain

# Option 2: Railway Dashboard
# Go to: Railway → Your Service → Settings → Networking
# Copy Public Domain
```

### Step 2: Configure Vercel Environment Variables

**Vercel Dashboard → Project → Settings → Environment Variables**

Add:
- `VITE_API_BASE_URL` = `https://YOUR-RAILWAY-URL.up.railway.app/api/v1`
- `VITE_WS_URL` = `wss://YOUR-RAILWAY-URL.up.railway.app` (if using WebSockets)

**Important:**
- Must start with `VITE_` for Vite to expose it
- Enable for Production, Preview, and Development
- Redeploy after adding variables (they're baked into build)

### Step 3: Configure Railway CORS

**Railway Dashboard → Your Backend Service → Variables**

Add/Update:
- `CORS_ORIGIN` = `https://skycrop.vercel.app,https://skycrop-*.vercel.app`

**Important:**
- Use `CORS_ORIGIN` (singular), NOT `CORS_ORIGINS` (plural)
- Include all Vercel domain variants
- Restart service after changing

### Step 4: Redeploy

1. **Vercel:** Redeploy latest deployment (or push new commit)
2. **Railway:** Restart service if CORS was changed

### Step 5: Verify

1. Open Vercel site
2. Open DevTools → Network tab
3. Try login/signup
4. Verify requests go to Railway URL, not Vercel URL

---

## Testing Checklist

- [ ] Railway backend is running (`/health` endpoint works)
- [ ] Railway backend has auth routes (`/api/v1/auth/login`, `/api/v1/auth/signup`)
- [ ] `VITE_API_BASE_URL` set in Vercel
- [ ] `CORS_ORIGIN` set in Railway (includes Vercel domain)
- [ ] Frontend redeployed on Vercel
- [ ] Railway service restarted (if CORS changed)
- [ ] Network requests show Railway URL
- [ ] No 404 errors
- [ ] No CORS errors
- [ ] Login works
- [ ] Signup works

---

## Files Modified

1. **`frontend/vercel.json`** - Added comment about Railway URL
2. **`DEPLOYMENT_FIX_GUIDE.md`** - Comprehensive fix guide
3. **`QUICK_FIX_STEPS.md`** - Quick reference for fixing
4. **`DEPLOYMENT_ISSUE_ANALYSIS.md`** - This analysis document

---

## Prevention for Future

1. **Documentation:**
   - Add deployment checklist to project docs
   - Document required environment variables
   - Include Railway URL in deployment guide

2. **Configuration:**
   - Use environment-specific config files
   - Validate environment variables on startup
   - Add health check endpoints

3. **Testing:**
   - Add integration tests for auth endpoints
   - Test with production-like URLs
   - Verify CORS configuration

---

## Related Files

- `frontend/src/config/env.ts` - Environment configuration
- `frontend/src/shared/api/httpClient.ts` - HTTP client using env config
- `backend/src/app.js` - CORS configuration
- `backend/src/api/routes/auth.routes.js` - Auth routes
- `frontend/vercel.json` - Vercel configuration
- `backend-env-example.txt` - Backend environment variables
- `frontend-env-example.txt` - Frontend environment variables

---

**Status:** ✅ Analysis Complete | 🔧 Solution Provided | 📋 Implementation Guide Ready
