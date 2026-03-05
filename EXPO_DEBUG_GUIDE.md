# Expo Go Debugging Guide

## 🔍 Quick Debug Steps

### 1. Run the Debug Script
```bash
cd mobile
node debug-expo.js
```

This will check:
- ✅ Backend API connectivity
- ✅ Expo dev server status
- ✅ Login API functionality

### 2. View Logs in Expo Go

#### Method A: Device Dev Menu
1. **Shake your device** (or press `Cmd+D` on iOS simulator / `Cmd+M` on Android)
2. Select **"Debug Remote JS"**
3. Open Chrome and go to `chrome://inspect`
4. Click **"inspect"** under your device
5. Check the **Console** tab for errors

#### Method B: Terminal Logs
- Check the terminal where you ran `npx expo start`
- All `console.log()` and `console.error()` messages appear here
- Look for red error messages

#### Method C: Metro Bundler Logs
- The Metro bundler terminal shows:
  - Bundle compilation errors
  - Module resolution issues
  - Syntax errors

### 3. Common Error Types

#### Red Screen in Expo Go
- **What it is**: JavaScript error caught by ErrorBoundary
- **How to debug**: 
  - Check the error message on screen
  - Look at terminal for full stack trace
  - Check Chrome DevTools console if remote debugging is enabled

#### Yellow Warning Box
- **What it is**: Warning (not fatal)
- **How to debug**: 
  - Read the warning message
  - Usually about deprecated APIs or missing dependencies

#### App Crashes on Launch
- **Possible causes**:
  - Missing dependencies
  - Syntax errors
  - Import errors
  - Configuration issues
- **How to debug**:
  ```bash
  cd mobile
  npx expo start -c  # Clear cache and restart
  ```

#### Network Errors
- **Symptoms**: API calls fail, "Network request failed"
- **How to debug**:
  - Run `node debug-expo.js` to test backend
  - Check if backend URL is correct in `src/config/env.ts`
  - Verify phone and computer are on same WiFi
  - Try tunnel mode: `npx expo start --tunnel`

### 4. Enable Remote Debugging

1. **Shake device** → Select **"Debug Remote JS"**
2. Open Chrome → `chrome://inspect`
3. Click **"inspect"** under your device
4. You'll see:
   - **Console**: All console.log/error messages
   - **Network**: All API requests
   - **Sources**: Debug JavaScript code
   - **React DevTools**: Component tree (if installed)

### 5. Check Specific Errors

#### Authentication Errors
- Check `src/context/AuthContext.tsx` logs
- Look for `[AuthContext]` prefixed messages
- Verify API_BASE_URL in `src/config/env.ts`

#### Navigation Errors
- Check `src/navigation/` files
- Look for route configuration issues
- Verify all screens are properly registered

#### API Errors
- Check `src/api/` files
- Look for network errors in console
- Verify backend is accessible

### 6. Clear Cache and Restart

If you're seeing stale errors or weird behavior:

```bash
cd mobile
npx expo start -c  # Clear cache
```

Or manually:
```bash
cd mobile
rm -rf node_modules/.cache
rm -rf .expo
npx expo start
```

### 7. Check for TypeScript Errors

```bash
cd mobile
npx tsc --noEmit
```

This will show TypeScript errors without building.

### 8. View Error Boundary Details

The app has an ErrorBoundary component that catches React errors. In dev mode, it shows:
- Error message
- Component stack trace
- Full error details

Look for the red error screen in Expo Go - it will show these details.

## 📱 Expo Go Dev Menu Options

When you shake the device or open dev menu:

- **Reload**: Refresh the app (like browser refresh)
- **Debug Remote JS**: Enable Chrome DevTools debugging
- **Show Element Inspector**: Inspect React Native components
- **Enable Fast Refresh**: Auto-reload on code changes
- **Show Perf Monitor**: Show FPS and performance metrics

## 🐛 Common Issues & Solutions

### Issue: "Unable to resolve module"
**Solution**: 
```bash
cd mobile
npm install
npx expo start -c
```

### Issue: "Network request failed"
**Solution**:
- Check backend is running: `node debug-expo.js`
- Verify API_BASE_URL in `src/config/env.ts`
- Check phone WiFi connection
- Try tunnel mode: `npx expo start --tunnel`

### Issue: "Cannot read property of undefined"
**Solution**:
- Check Chrome DevTools console for full stack trace
- Look at the component mentioned in error
- Add null checks in your code

### Issue: App stuck on loading screen
**Solution**:
- Check terminal for errors
- Look for infinite loops in useEffect
- Check if API calls are hanging
- Try reloading: Shake device → Reload

### Issue: "Expo Go can't connect to server"
**Solution**:
- Verify phone and computer on same WiFi
- Check firewall isn't blocking port 8081
- Try tunnel mode: `npx expo start --tunnel`
- Manually enter URL in Expo Go: `exp://YOUR_IP:8081`

## 🔧 Debugging Tools

### 1. React Native Debugger
Install: https://github.com/jhen0409/react-native-debugger

### 2. Flipper (Advanced)
For more advanced debugging: https://fbflipper.com/

### 3. React DevTools
```bash
npm install -g react-devtools
react-devtools
```

## 📊 What to Check When Debugging

1. **Terminal Output**: First place to look for errors
2. **Chrome DevTools Console**: If remote debugging enabled
3. **Error Boundary Screen**: Red screen in app shows React errors
4. **Network Tab**: Check API requests in Chrome DevTools
5. **Metro Bundler**: Shows bundle compilation status

## ✅ Quick Checklist

Before reporting an error, check:
- [ ] Terminal shows no red errors
- [ ] Backend is accessible (run `node debug-expo.js`)
- [ ] Phone and computer on same WiFi
- [ ] Cache cleared (`npx expo start -c`)
- [ ] Dependencies installed (`npm install`)
- [ ] Checked Chrome DevTools console (if remote debugging enabled)
- [ ] Checked Error Boundary screen in app

## 🆘 Still Having Issues?

1. **Capture Error Screenshot**: Take a screenshot of the error screen
2. **Copy Terminal Output**: Copy the error from terminal
3. **Check Network**: Run `node debug-expo.js` and share output
4. **Check Config**: Verify `src/config/env.ts` has correct API URL
5. **Share Details**: 
   - Device type (iOS/Android)
   - Expo Go version
   - Error message
   - Steps to reproduce

---

**Remember**: Most errors show up in the terminal where Expo is running. Always check there first!
