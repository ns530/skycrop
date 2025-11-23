# ⚡ EXPO DEPLOYMENT - QUICK START

**Time:** 30 minutes  
**Steps:** 7 simple steps

---

## 🔧 STEP 1: INSTALL TOOLS (5 min)

```bash
npm install -g expo-cli eas-cli
```

**Verify:**
```bash
expo --version
eas --version
```

---

## 👤 STEP 2: CREATE ACCOUNT (3 min)

```bash
cd D:\FYP\SkyCrop\mobile
eas login
```

**Or create at:** https://expo.dev

---

## ⚙️ STEP 3: CONFIGURE PROJECT (2 min)

```bash
eas build:configure
```

**This will:**
- Link to your Expo account
- Generate EAS Project ID
- Update app.json

---

## 🏗️ STEP 4: BUILD APK (15 min)

```bash
eas build --platform android --profile production
```

**Wait for build:**
- Build runs on Expo servers
- Takes ~10-15 minutes
- You'll get an email when done
- Check status: https://expo.dev

---

## 📥 STEP 5: DOWNLOAD APK (1 min)

**After build completes:**

```bash
eas build:download --platform android --profile production
```

**Or get URL:**
```bash
eas build:list --platform android
```

**APK URL format:**
```
https://expo.dev/artifacts/eas/[build-id].apk
```

---

## 📱 STEP 6: TEST ON DEVICE (5 min)

1. **Transfer APK to phone**
   - Email to yourself
   - Or use Google Drive

2. **Install on phone**
   - Enable "Unknown sources"
   - Open APK → Install

3. **Test app**
   - Open SkyCrop
   - Try login
   - Check features

---

## 💬 STEP 7: TELL ME! (instant)

**When done, say:**

```
"APK built: [your-expo-build-url]"
```

**Then I'll:**
- ✅ Save APK URL
- ✅ Update config
- ✅ Complete Phase 3!
- ✅ Generate summary

---

## ❓ QUICK HELP:

### Can't install expo-cli?
```bash
# Try with sudo (Mac/Linux) or run as Admin (Windows)
npm install -g expo-cli --force
```

### Build failed?
- Check your Expo account status
- Verify internet connection
- Try again: `eas build --platform android --profile production`

### APK won't install?
- Settings → Security → Unknown sources → Enable
- Or: Settings → Apps → Special access → Install unknown apps

---

## 🔗 QUICK LINKS:

**Expo Dashboard:** https://expo.dev  
**Your Builds:** https://expo.dev/accounts/[your-account]/builds  
**Docs:** https://docs.expo.dev/build/

---

## ⏱️ TIMELINE:

```
Step 1: Install tools       → 5 min
Step 2: Create account       → 3 min
Step 3: Configure            → 2 min
Step 4: Build APK            → 15 min (automated)
Step 5: Download             → 1 min
Step 6: Test                 → 5 min
Step 7: Report back          → instant
──────────────────────────────────────
Total:                         ~30 min
```

---

## 🎯 CHECKLIST:

Before building:
- [ ] expo-cli installed
- [ ] eas-cli installed
- [ ] Expo account created
- [ ] In mobile/ directory

After building:
- [ ] APK downloaded
- [ ] Tested on device
- [ ] App works correctly

---

## 🚀 START NOW:

```bash
# Copy and paste this:
npm install -g expo-cli eas-cli && cd D:\FYP\SkyCrop\mobile && eas login
```

**Then continue with build command!**

---

**📖 Full guide:** `PHASE_3_EXPO_DEPLOYMENT_GUIDE.md`

**💪 You've got this!**

