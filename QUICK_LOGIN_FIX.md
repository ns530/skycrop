# Quick Login Fix Guide

## 🔴 Problem
Cannot login from `http://localhost:8081/` - CORS blocking requests

## ✅ Solution Applied
Updated Railway `CORS_ORIGIN` to include localhost origins.

## ⏳ Wait for Redeploy
Railway is automatically redeploying (2-3 minutes).

---

## 🧪 Test After Redeploy

1. **Wait 2-3 minutes** for Railway to redeploy
2. **Refresh browser** at `http://localhost:8081`
3. **Open browser console** (Press F12)
4. **Try to login**:
   - Email: `nadunsulochana92@gmail.com`
   - Password: `6pjNSVz28VZaXKu`
5. **Check console** - should see NO CORS errors

---

## 📱 Alternative: Use Expo Go (Works Now!)

**No need to wait!** Use Expo Go on your phone:

1. **Install Expo Go** app (iOS/Android)
2. **Connect phone to same WiFi** as computer
3. **Open Expo Go** → Scan QR code from terminal
4. **Login works immediately** (no CORS issues)

**Why this works**: Native apps don't have CORS restrictions!

---

## 🔍 Verify Fix Worked

### Check Browser Console (F12):
- ✅ **Before**: `CORS policy` error
- ✅ **After**: No CORS errors, login succeeds

### Check Network Tab:
- ✅ **Before**: Request blocked (CORS)
- ✅ **After**: `POST /api/v1/auth/login` → 200 OK

---

## 🐛 If Still Not Working

1. **Check Railway Dashboard**:
   - Go to `skycrop-backend` project
   - Check if new deployment completed
   - Verify `CORS_ORIGIN` variable is updated

2. **Manual CORS Update**:
   - Railway Dashboard → Backend Service → Variables
   - Set `CORS_ORIGIN` to: `https://skycrop.vercel.app,http://localhost:8081,http://localhost:19006`
   - Save and wait for redeploy

3. **Use Expo Go Instead**:
   - Works immediately
   - No CORS issues
   - Better testing experience

---

**Status**: CORS fix applied, waiting for redeploy  
**Alternative**: Use Expo Go app (works now!)
