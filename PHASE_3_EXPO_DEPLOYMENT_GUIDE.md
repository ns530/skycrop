# 📱 PHASE 3: EXPO MOBILE APP DEPLOYMENT - COMPLETE GUIDE

**Date:** November 22, 2024  
**Status:** Ready to deploy!  
**Duration:** 30 minutes  
**Difficulty:** Medium

---

## ✅ PREPARATION COMPLETE:

- ✅ Mobile app code ready
- ✅ `app.json` configured for production
- ✅ `eas.json` configured with production URLs
- ✅ Environment variables updated:
  - API: `https://skycrop-staging-production.up.railway.app/api/v1`
  - WebSocket: `wss://skycrop-staging-production.up.railway.app`
- ✅ Version updated to 1.0.0
- ✅ Ready for Expo EAS Build!

---

## 🎯 DEPLOYMENT STEPS:

### **Step 1: Install Expo CLI & EAS CLI** (5 minutes)

**Install both tools globally:**

```bash
npm install -g expo-cli eas-cli
```

**Verify installation:**

```bash
expo --version
eas --version
```

**Expected output:**
```
6.x.x  (or similar for expo)
5.x.x  (or similar for eas)
```

---

### **Step 2: Create Expo Account** (3 minutes)

**Option A: Command line (Recommended)**

```bash
eas login
```

- If you don't have an account, it will prompt you to create one
- Enter your email and create a password

**Option B: Web (Alternative)**

1. Go to: https://expo.dev
2. Click "Sign up"
3. Create your account
4. Then run `eas login` in terminal

---

### **Step 3: Initialize EAS for Your Project** (2 minutes)

```bash
cd D:\FYP\SkyCrop\mobile

# Configure EAS project
eas build:configure
```

**What this does:**
- Links your project to your Expo account
- Creates/updates `eas.json` (already exists)
- Generates an EAS Project ID
- Updates `app.json` with the project ID

---

### **Step 4: Build Production APK** (15 minutes)

**Build for Android (APK format):**

```bash
eas build --platform android --profile production
```

**What happens:**
1. ✅ Code uploaded to Expo servers
2. ✅ Dependencies installed
3. ✅ Android build created
4. ✅ APK generated
5. ✅ Download link provided

**Build time:** ~10-15 minutes (on Expo servers)

**While building:**
- You can close your terminal
- Check status: https://expo.dev/accounts/[your-account]/builds
- You'll get a notification when done

---

### **Step 5: Download APK** (1 minute)

**After build completes:**

```bash
# Download automatically
eas build:download --platform android --profile production

# Or get the URL
eas build:list --platform android
```

**APK will be at:**
```
https://expo.dev/artifacts/eas/[build-id].apk
```

**Save this URL!** You'll distribute it to users.

---

### **Step 6: Test APK on Device** (5 minutes)

**Install on Android device:**

1. **Transfer APK to phone:**
   - Email the APK to yourself
   - Or use Google Drive/Dropbox
   - Or scan QR code from Expo dashboard

2. **Install:**
   - Open APK on phone
   - Allow "Install from unknown sources"
   - Tap "Install"

3. **Test:**
   - Open SkyCrop app
   - Try login/registration
   - Test field creation
   - Verify map works
   - Check backend connection

---

### **Step 7: Distribute to Users** (Optional)

**Option A: Direct Download**
- Upload APK to Google Drive
- Share link with users
- Users download and install

**Option B: Create Download Page**
- Host APK on your Vercel site
- Create `/download` page
- Add download button

**Option C: Internal Testing (Recommended)**
- Use Expo's internal distribution
- Share link: `https://expo.dev/artifacts/eas/[build-id]`
- Users can install directly

---

## 🔧 CONFIGURATION DETAILS:

### **App Version:**
```
Version: 1.0.0
Version Code: 1
Package: com.skycrop.mobile
```

### **Environment Variables (Production):**
```env
EXPO_PUBLIC_API_BASE_URL=https://skycrop-staging-production.up.railway.app/api/v1
EXPO_PUBLIC_WS_URL=wss://skycrop-staging-production.up.railway.app
EXPO_PUBLIC_ENV=production
```

### **Permissions:**
- Camera (for field images)
- Location (for field mapping)
- Storage (for saving images)
- Internet (for API calls)
- Network State (for connectivity checks)

---

## 📊 BUILD PROFILES:

### **Development:**
```json
{
  "developmentClient": true,
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```
Use for: Local testing with live reload

### **Preview:**
```json
{
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```
Use for: Testing with production backend

### **Production:**
```json
{
  "android": {
    "buildType": "apk"
  }
}
```
Use for: Final release to users

---

## ⚠️ COMMON ISSUES & FIXES:

### Issue 1: "expo command not found"
**Solution:**
```bash
npm install -g expo-cli
# Or restart terminal after installation
```

### Issue 2: "eas command not found"
**Solution:**
```bash
npm install -g eas-cli
```

### Issue 3: "Build failed - Missing google-services.json"
**Solution:**
- This is optional for MVP
- Can skip Firebase for now
- Or use the example file

### Issue 4: "Build failed - Google Maps API key"
**Solution:**
- Get free key from: https://console.cloud.google.com/
- Or use default maps for now

### Issue 5: "APK won't install on phone"
**Solution:**
- Enable "Install from unknown sources"
- Settings → Security → Unknown sources
- Or Settings → Apps → Special access → Install unknown apps

---

## 💡 QUICK TIPS:

### Tip 1: Build Queue
- Free Expo accounts: 1 concurrent build
- Build queue: ~5-10 min wait time
- Can upgrade for faster builds

### Tip 2: APK vs AAB
- **APK**: Direct install, easier distribution
- **AAB**: For Play Store only
- **For MVP**: Use APK ✅

### Tip 3: Testing
- Test on real Android device
- Minimum Android 5.0 (API 21)
- Works on most phones from 2015+

### Tip 4: Updates
- Over-the-air (OTA) updates available
- Change code, run `eas update`
- Users get updates without reinstalling

---

## 🎯 SUCCESS CRITERIA:

Before completing Phase 3, verify:

- [ ] Expo CLI installed
- [ ] EAS CLI installed
- [ ] Expo account created
- [ ] EAS project configured
- [ ] Production build completed
- [ ] APK downloaded
- [ ] APK installed on device
- [ ] App opens successfully
- [ ] Can connect to backend
- [ ] Login/registration works
- [ ] Maps load correctly

---

## 📝 AFTER DEPLOYMENT:

**When build completes, tell me:**

```
"APK built: https://expo.dev/artifacts/eas/[your-build-id].apk"
```

**Then I'll automatically:**
1. ✅ Update deployment_config.txt
2. ✅ Save APK URL
3. ✅ Create distribution guide
4. ✅ Complete Phase 3!
5. ✅ Generate final deployment summary

---

## 🔗 USEFUL LINKS:

**Expo Dashboard:** https://expo.dev  
**EAS Build Status:** https://expo.dev/accounts/[your-account]/builds  
**EAS Docs:** https://docs.expo.dev/build/introduction/  
**Android Min Requirements:** Android 5.0+ (API 21+)

---

## ⏱️ TIMELINE:

| Step | Duration | Type |
|------|----------|------|
| Install CLI tools | 5 min | Manual |
| Create Expo account | 3 min | Manual |
| Initialize EAS | 2 min | Manual |
| Build APK | 10-15 min | Automated (Expo servers) |
| Download APK | 1 min | Manual |
| Test on device | 5 min | Manual |
| **Total** | **~30 min** | **Mixed** |

---

## 🚀 READY TO BUILD?

**Start with Step 1:**

```bash
npm install -g expo-cli eas-cli
```

**Then follow the steps above!** ⬆️

**Questions? Just ask!** 💬

---

**🎯 Goal:** Get your Android APK built and tested!

**⏱️ Time:** ~30 minutes

**💪 Let's do this!**

