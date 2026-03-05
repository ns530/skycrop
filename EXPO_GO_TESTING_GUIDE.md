# Expo Go Testing Guide

## 📱 How to Test the Mobile App with Expo Go

### Step 1: Install Expo Go
- **iOS**: Download from App Store
- **Android**: Download from Google Play Store

### Step 2: Connect to Same Network
- Make sure your phone and computer are on the same WiFi network
- This is required for Expo Go to connect to the development server

### Step 3: Start Expo Development Server
The server is already running! You should see:
- QR code in the terminal
- URL like: `exp://192.168.x.x:8081`

### Step 4: Connect with Expo Go

**Option A: Scan QR Code**
1. Open Expo Go app on your phone
2. Tap "Scan QR Code"
3. Scan the QR code from the terminal

**Option B: Enter URL Manually**
1. Open Expo Go app
2. Tap "Enter URL manually"
3. Enter: `exp://YOUR_IP:8081`
   - Replace `YOUR_IP` with your computer's local IP address
   - You can find it in the Expo terminal output

### Step 5: Test Login

Once the app loads in Expo Go:

1. **Login Screen** should appear
2. **Enter Credentials**:
   - Email: `nadunsulochana92@gmail.com`
   - Password: `6pjNSVz28VZaXKu`
3. **Tap Login**
4. **Expected**: Should navigate to Dashboard

---

## 🔍 Testing Checklist

### Authentication Flow
- [ ] Login screen displays correctly
- [ ] Can enter email and password
- [ ] Login button works
- [ ] Successful login navigates to Dashboard
- [ ] Failed login shows error message

### Main App Features
- [ ] Dashboard loads after login
- [ ] Fields list displays
- [ ] Can create new field
- [ ] Can view field details
- [ ] Weather screen works
- [ ] Profile screen works

### API Integration
- [ ] Login API call succeeds
- [ ] Fields API calls work
- [ ] Health data loads
- [ ] Recommendations load
- [ ] Error handling works for network issues

---

## 🐛 Common Issues

### Issue: Can't Connect to Expo Server
**Solution**: 
- Check phone and computer are on same WiFi
- Try using tunnel mode: `npx expo start --tunnel`
- Check firewall isn't blocking port 8081

### Issue: App Crashes on Launch
**Solution**:
- Check terminal for error messages
- Look for missing dependencies
- Try clearing cache: `npx expo start -c`

### Issue: Login Fails
**Solution**:
- Verify backend is accessible
- Check API_BASE_URL in `src/config/env.ts`
- Test API directly with `test-mobile-login.js`

---

## 📊 Test Results

After testing, note:
- ✅ What works
- ❌ What doesn't work
- ⚠️ Any errors or warnings
- 📝 Screenshots if possible

---

**Status**: Expo server running on http://localhost:8081  
**Ready for Testing**: ✅ Yes
