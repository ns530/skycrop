# Login Issue Fix - CORS Problem

## 🔴 Problem Identified

**Issue**: Cannot login from `http://localhost:8081/` (web browser)

**Root Cause**: **CORS (Cross-Origin Resource Sharing) restriction**

The backend CORS is configured to only allow:
- `https://skycrop.vercel.app`

But when accessing from web browser at `http://localhost:8081`, the origin is:
- `http://localhost:8081`

This origin is **blocked** by CORS, so login requests fail.

---

## ✅ Solution: Update Backend CORS Configuration

### Option 1: Add Localhost to CORS (Recommended for Development)

Update Railway backend environment variable:

1. Go to Railway Dashboard
2. Select `skycrop-backend` project
3. Go to **Variables** tab
4. Find `CORS_ORIGIN` variable
5. Update it to allow multiple origins:
   ```
   https://skycrop.vercel.app,http://localhost:8081,http://localhost:19006
   ```
6. Save and redeploy

### Option 2: Use Wildcard (Less Secure, but Works)

Set `CORS_ORIGIN` to `*` (allows all origins):
- **Note**: Less secure, but works for development
- Railway already has this as fallback, but env var overrides it

### Option 3: Test on Mobile Device (Expo Go)

Instead of web browser, use **Expo Go app** on your phone:
- This uses native networking, not web browser
- CORS doesn't apply to native apps
- Should work without CORS changes

---

## 🔍 Current CORS Configuration

**Backend CORS Setting**:
```javascript
cors({
  origin: process.env.CORSORIGIN || '*',
  credentials: true,
})
```

**Current CORS_ORIGIN value**: `https://skycrop.vercel.app`

**Problem**: This blocks `http://localhost:8081`

---

## 🧪 How to Verify the Fix

After updating CORS:

1. **Test from Browser**:
   - Open `http://localhost:8081`
   - Open browser console (F12)
   - Try to login
   - Check Network tab - should see 200 OK (not CORS error)

2. **Check Console Errors**:
   - Before fix: `Access to fetch at '...' from origin 'http://localhost:8081' has been blocked by CORS policy`
   - After fix: No CORS errors

---

## 📱 Alternative: Use Expo Go (No CORS Issues)

**Best Solution for Testing**: Use Expo Go on your phone instead of web browser

**Why**:
- Native apps don't have CORS restrictions
- Works exactly like production mobile app
- No backend changes needed

**Steps**:
1. Install Expo Go on your phone
2. Connect to same WiFi as computer
3. Scan QR code from terminal
4. Login should work immediately

---

## 🐛 Debugging Steps

If login still doesn't work after CORS fix:

1. **Open Browser Console** (F12)
   - Look for red error messages
   - Check Network tab for failed requests
   - Note the exact error message

2. **Check API Response**:
   ```bash
   node test-login-debug.js
   ```

3. **Verify Backend is Accessible**:
   ```bash
   curl https://backend-production-9e94.up.railway.app/health
   ```

4. **Check Mobile App Config**:
   - Verify `API_BASE_URL` in `mobile/src/config/env.ts`
   - Should be: `https://backend-production-9e94.up.railway.app`

---

## ✅ Quick Fix Summary

**For Web Browser Testing**:
1. Update `CORS_ORIGIN` in Railway to include `http://localhost:8081`
2. Or set to `*` for development
3. Redeploy backend

**For Mobile Testing (Recommended)**:
1. Use Expo Go app on phone
2. No CORS issues
3. Works immediately

---

**Status**: CORS blocking localhost requests  
**Fix**: Update Railway CORS_ORIGIN variable  
**Alternative**: Use Expo Go app (no CORS issues)
