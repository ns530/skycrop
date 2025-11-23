# 🔍 How to View Errors in Expo Go

## Method 1: Shake Your Device (Easiest) 📱

### On Android:
1. **Shake your phone** while the app is open
2. A **developer menu** will appear
3. Tap **"Show Element Inspector"** or **"Debug Remote JS"**
4. Errors will show in a **red error overlay** on screen

### On iOS:
1. **Shake your device** or press **Cmd + D** (if using simulator)
2. Developer menu appears
3. Tap **"Show Element Inspector"**

---

## Method 2: Check Terminal Logs 💻

The **Expo dev server terminal** shows all errors:

### What to Look For:
- **Red error messages** in the terminal
- **Stack traces** showing file names and line numbers
- **Module resolution errors** (e.g., "Cannot find module...")
- **Syntax errors** (e.g., "Unexpected token...")

### Example Error in Terminal:
```
ERROR  Warning: Error: Cannot find module './components/SomeComponent'
    at Object.<anonymous> (App.tsx:12:1)
```

---

## Method 3: Enable Remote Debugging 🌐

1. **Shake device** → Developer menu
2. Tap **"Debug Remote JS"**
3. Open **Chrome DevTools**:
   - Go to `chrome://inspect` in Chrome
   - Click **"inspect"** under your device
4. Check **Console tab** for errors

---

## Method 4: Check Metro Bundler Logs 📊

In the terminal where `expo start` is running:

### Look for:
- **Bundling errors** (red text)
- **Module not found** errors
- **Type errors** (if TypeScript checking is enabled)
- **Network errors** (500, 404, etc.)

### Common Error Patterns:
```
❌ ERROR: Cannot find module 'xyz'
❌ ERROR: Unable to resolve module
❌ ERROR: SyntaxError: Unexpected token
❌ ERROR: Network request failed
```

---

## Method 5: Enable Error Overlay in Code 🎨

Add this to your `App.tsx` to see errors on screen:

```typescript
import { LogBox } from 'react-native';

// Show all warnings and errors
LogBox.ignoreAllLogs(false);

// Or ignore specific warnings
LogBox.ignoreLogs([
  'Warning: ...',
]);
```

---

## Method 6: Check Network Tab (For API Errors) 🌐

1. **Shake device** → Developer menu
2. Tap **"Show Element Inspector"**
3. Go to **Network tab**
4. Check for failed API requests (red entries)

---

## Quick Debugging Checklist ✅

When you see an error:

1. ✅ **Check terminal** - Most errors appear here first
2. ✅ **Shake device** - See error overlay on screen
3. ✅ **Check file mentioned** - Open the file in error stack trace
4. ✅ **Check imports** - Make sure all imports are correct
5. ✅ **Check dependencies** - Run `npm install` if needed
6. ✅ **Clear cache** - Run `npx expo start --clear`

---

## Common Error Types & Solutions 🔧

### 1. **"Cannot find module"**
- **Solution**: Check if package is installed: `npm list <package-name>`
- **Fix**: Install missing package: `npm install <package-name>`

### 2. **"Network request failed"**
- **Solution**: Check if backend is running
- **Fix**: Verify API URL in `.env` or `app.json`

### 3. **"500 Internal Server Error"**
- **Solution**: Check Metro bundler logs in terminal
- **Fix**: Usually a code error - check the file mentioned in error

### 4. **"TypeError: Cannot read property..."**
- **Solution**: Check if object exists before accessing
- **Fix**: Add null checks: `object?.property`

### 5. **"SyntaxError: Unexpected token"**
- **Solution**: Check for missing brackets, quotes, etc.
- **Fix**: Use a linter or check the file manually

---

## Pro Tips 💡

1. **Keep terminal visible** - Errors appear there first
2. **Use `console.log()`** - Add logs to track execution flow
3. **Check React Native Debugger** - Better than Chrome DevTools
4. **Use `expo start --tunnel`** - If network issues
5. **Check Expo Go version** - Must match SDK version

---

## Still Can't See Errors? 🤔

Try these:

1. **Restart Expo server**: `npx expo start --clear`
2. **Reload app**: Shake device → "Reload"
3. **Check Expo Go version**: Update from Play Store/App Store
4. **Check SDK compatibility**: Make sure Expo Go SDK matches project SDK

---

## Need More Help? 📚

- **Expo Docs**: https://docs.expo.dev/
- **React Native Debugging**: https://reactnative.dev/docs/debugging
- **Metro Bundler**: https://metrobundler.dev/

