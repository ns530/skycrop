# How to View Errors in Terminal

## Quick Steps

### Method 1: Check Expo Terminal (Easiest)
1. **Look at the terminal where you ran `npx expo start`**
2. All `console.error()` and `console.log()` messages appear there
3. Errors from ErrorBoundary will show with `❌ ========== ERROR BOUNDARY CAUGHT ERROR ==========`

### Method 2: Enable Remote Debugging (Best for Detailed Errors)

1. **Shake your device** (or press `Cmd+D` on iOS simulator / `Cmd+M` on Android)
2. Tap **"Debug Remote JS"**
3. Open Chrome and go to `chrome://inspect`
4. Click **"inspect"** under your device
5. Check the **Console** tab - all errors will appear here

### Method 3: View Error on Screen (Dev Mode)

1. When you see the red error box, tap **"Show Error Details"**
2. This will show the error message and stack trace
3. The full details are also logged to terminal

## What You'll See in Terminal

When an error occurs, you'll see output like this:

```
❌ ========== ERROR BOUNDARY CAUGHT ERROR ==========
Error: [Error object]
Error Name: TypeError
Error Message: Cannot read property 'xyz' of undefined
Error Stack: [Full stack trace]

Component Stack:
[Component hierarchy where error occurred]

Full Error Info: [JSON details]
==========================================
```

## Common Error Locations

- **Expo Terminal**: Where you ran `npx expo start`
- **Chrome DevTools Console**: If remote debugging is enabled
- **ErrorBoundary Screen**: Tap "Show Error Details" button

## Tips

1. **Keep the Expo terminal visible** - it shows all errors in real-time
2. **Enable remote debugging** for better error inspection
3. **Check the error message** - it usually tells you what went wrong
4. **Look at the component stack** - it shows where the error occurred

## If You Don't See Errors

1. Make sure you're in **development mode** (`__DEV__ = true`)
2. Check that **LogBox** is not ignoring errors
3. Try **reloading the app** (shake device → Reload)
4. Check if **remote debugging** is enabled

---

**Remember**: All errors are automatically logged to the terminal where Expo is running!
