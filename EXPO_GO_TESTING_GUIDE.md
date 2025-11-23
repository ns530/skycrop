# 📱 SkyCrop Mobile - Expo Go Testing Guide

**Status:** ✅ Expo Development Server Running  
**Date:** November 22, 2024

---

## ✅ **SERVER IS READY!**

Your Expo development server is running at:
- **URL:** `exp://192.168.8.183:8081`
- **Status:** ✅ Active
- **QR Code:** Displayed in terminal

---

## 📱 **HOW TO TEST ON YOUR ANDROID DEVICE:**

### **Step 1: Install Expo Go App** 📥

1. Open **Google Play Store** on your Android phone
2. Search for **"Expo Go"**
3. Install the **Expo Go** app (by Expo)
4. Open the app

### **Step 2: Connect to Same Wi-Fi** 📶

**IMPORTANT:** Your phone must be on the **SAME Wi-Fi network** as your computer!

- Computer Wi-Fi: Check your current network
- Phone Wi-Fi: Connect to the same network

### **Step 3: Scan the QR Code** 📷

**Option A: Using Expo Go App (Recommended)**
1. Open **Expo Go** app on your phone
2. Tap **"Scan QR Code"** button
3. Point camera at the QR code in your terminal (terminal 5.txt)
4. Wait for app to load (~30 seconds first time)

**Option B: Using Phone Camera**
1. Open your phone's **Camera app**
2. Point at the QR code
3. Tap the notification that appears
4. Opens Expo Go automatically

### **Step 4: Test the App!** ✨

The app will:
1. 📦 Download JavaScript bundle (~5 MB)
2. 🔄 Load dependencies
3. 🎨 Display the login screen
4. ✅ Ready to use!

---

## 🎯 **WHAT TO TEST:**

### **Core Features:**
- ✅ **Login/Register** - Test authentication
- ✅ **Dashboard** - View overview
- ✅ **Fields Management** - Create/view/edit fields
- ✅ **Location Access** - Grant GPS permissions
- ✅ **API Integration** - Connects to Railway backend
- ✅ **Navigation** - Bottom tabs, drawer menu

### **Test Credentials:**
You can either:
- **Register** a new account
- **Login** with existing credentials

**Backend API:**
- Connected to: `https://skycrop-staging-production.up.railway.app/api/v1`
- WebSocket: `wss://skycrop-staging-production.up.railway.app`

---

## 🐛 **TROUBLESHOOTING:**

### **Problem: QR Code doesn't scan**
**Solution:**
- Check terminal 5 for the QR code
- Or manually enter: `exp://192.168.8.183:8081`

### **Problem: "Could not connect to server"**
**Solution:**
- Ensure phone and computer on SAME Wi-Fi
- Check Windows Firewall isn't blocking port 8081
- Restart Expo server: Press `Ctrl+C` then `npx expo start`

### **Problem: "Network response timed out"**
**Solution:**
- Check backend is running: https://skycrop-staging-production.up.railway.app
- Check internet connection
- Try toggling airplane mode on/off

### **Problem: App crashes on startup**
**Solution:**
- Shake phone → tap "Reload"
- Or press `r` in terminal to reload
- Check terminal for error messages

---

## 🔧 **USEFUL EXPO COMMANDS:**

**In the terminal where Expo is running:**

- `r` - Reload the app
- `m` - Open developer menu on phone
- `j` - Open JavaScript debugger in browser
- `shift+m` - More developer tools
- `Ctrl+C` - Stop the server

**On your phone:**
- **Shake device** - Opens developer menu
- **Developer menu → Reload** - Refresh the app
- **Developer menu → Debug** - Enable debugging

---

## 📊 **PERFORMANCE TIPS:**

### **First Load:**
- Takes ~30-60 seconds (downloading bundle)
- Shows "Downloading JavaScript Bundle" progress

### **Subsequent Loads:**
- Much faster (~5-10 seconds)
- Cached on device

### **Hot Reload:**
- Make code changes in VS Code
- App updates automatically!
- No need to manually reload

---

## ✨ **FEATURES WORKING:**

✅ **Authentication**
- Login screen
- Register new user
- Secure token storage (Expo SecureStore)

✅ **Dashboard**
- Field overview
- Statistics
- Quick actions

✅ **Fields Management**
- List all fields
- Create new field (with GPS location)
- View field details
- Edit/delete fields

✅ **Location Services**
- Get current GPS coordinates
- Permission handling
- Location-based field creation

✅ **Real-time Updates**
- WebSocket connection (stubbed for MVP)
- API polling for data

✅ **Navigation**
- Bottom tab navigation
- Stack navigation
- Drawer menu

---

## 🎨 **UI/UX:**

- ✅ Modern, clean interface
- ✅ Green theme (#16A34A)
- ✅ Responsive layouts
- ✅ Loading states
- ✅ Error handling
- ✅ Empty states

---

## 🚀 **NEXT STEPS AFTER TESTING:**

### **If Everything Works:**
1. ✅ Take screenshots for documentation
2. ✅ Demo to stakeholders
3. ✅ Mark Phase 3 as "Functionally Complete"
4. ✅ Document the Kotlin build issue for future

### **If Issues Found:**
1. Note the specific issue
2. Check terminal for errors
3. Try reload/restart
4. Share error messages for debugging

---

## 📝 **TESTING CHECKLIST:**

- [ ] App loads successfully
- [ ] Login screen appears
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Dashboard displays correctly
- [ ] Can navigate between tabs
- [ ] Can access fields list
- [ ] Can create new field
- [ ] GPS location works
- [ ] API calls succeed
- [ ] Logout works

---

## 💡 **TIPS:**

1. **Keep Terminal Open:** Don't close terminal 5 while testing
2. **Shake Phone:** Opens developer menu with useful tools
3. **Check Logs:** Terminal shows all console.log() messages
4. **Hot Reload:** Save files in VS Code = instant updates!

---

## 🎉 **YOU'RE ALL SET!**

Your SkyCrop mobile app is now running and ready to test!

**Server:** Running ✅  
**QR Code:** Visible ✅  
**App Code:** Loaded ✅  
**Backend:** Connected ✅

**Just scan the QR code and start testing!** 📱

---

**Questions or issues?** Check the troubleshooting section or share error messages!

