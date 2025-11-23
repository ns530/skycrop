# 📱 How to Mirror Your Phone Screen on Laptop (Android)

## Method 1: Using scrcpy (Recommended - Free & Best) ⭐

### Step 1: Install scrcpy

**Windows:**
```powershell
# Using Chocolatey (if installed)
choco install scrcpy

# OR Download from: https://github.com/Genymobile/scrcpy/releases
# Extract and add to PATH
```

**Or use portable version:**
1. Download from: https://github.com/Genymobile/scrcpy/releases
2. Extract `scrcpy-win64-v2.x.zip`
3. Run `scrcpy.exe` directly (no installation needed!)

### Step 2: Enable USB Debugging on Phone

1. **Go to Settings** → **About Phone**
2. Tap **"Build Number"** 7 times (enables Developer Options)
3. Go back to **Settings** → **Developer Options**
4. Enable **"USB Debugging"**
5. Enable **"Stay Awake"** (optional, keeps screen on)

### Step 3: Connect Phone to Laptop

1. **Connect phone via USB cable**
2. On phone, when prompted: **"Allow USB debugging?"** → Tap **"Allow"**
3. Check **"Always allow from this computer"** (optional)

### Step 4: Mirror Screen

```powershell
# Open PowerShell/CMD in the scrcpy folder
scrcpy
```

**That's it!** Your phone screen appears on your laptop! 🎉

---

## Method 2: Using ADB (Android Debug Bridge) 🔧

### Step 1: Install ADB

**Windows:**
```powershell
# Using Chocolatey
choco install adb

# OR Download Android Platform Tools:
# https://developer.android.com/studio/releases/platform-tools
```

### Step 2: Enable USB Debugging (Same as Method 1)

### Step 3: Connect and Mirror

```powershell
# Check if device is connected
adb devices

# Start screen mirroring
adb shell screenrecord /sdcard/screen.mp4
# OR use scrcpy (better option)
```

---

## Method 3: Using Vysor (Easy but Paid) 💰

1. **Install Vysor**: https://www.vysor.io/
2. **Connect phone via USB**
3. **Enable USB Debugging** (same as above)
4. **Open Vysor** → Your phone appears!

**Note:** Free version has limitations, paid version is better.

---

## Method 4: Wireless Screen Mirroring (No USB) 📶

### Using scrcpy Wirelessly:

```powershell
# Step 1: Connect phone via USB first (one time setup)
adb devices

# Step 2: Enable wireless debugging
adb tcpip 5555

# Step 3: Disconnect USB, connect to same Wi-Fi

# Step 4: Find phone IP (Settings → About Phone → IP Address)
# Example: 192.168.1.100

# Step 5: Connect wirelessly
adb connect 192.168.1.100:5555

# Step 6: Start scrcpy
scrcpy
```

---

## Method 5: Using Expo Dev Tools (Logs Only) 📊

Expo doesn't mirror your screen, but you can see logs:

1. **Shake phone** → **"Debug Remote JS"**
2. Open **Chrome** → `chrome://inspect`
3. Click **"inspect"** under your device
4. See **Console logs** (not screen, but useful for debugging)

---

## Quick Setup Script for Windows 🚀

Save this as `setup-screen-mirroring.ps1`:

```powershell
# Check if ADB is installed
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ADB not found. Installing..." -ForegroundColor Red
    Write-Host "Download from: https://developer.android.com/studio/releases/platform-tools" -ForegroundColor Yellow
    exit
}

Write-Host "📱 Checking for connected devices..." -ForegroundColor Cyan
adb devices

Write-Host ""
Write-Host "✅ If you see your device above, run: scrcpy" -ForegroundColor Green
Write-Host "📥 Download scrcpy: https://github.com/Genymobile/scrcpy/releases" -ForegroundColor Yellow
```

---

## Troubleshooting 🔧

### "adb: command not found"
- **Solution**: Install Android Platform Tools or add to PATH

### "No devices found"
- **Solution**: 
  1. Check USB cable (use data cable, not charging-only)
  2. Enable USB Debugging on phone
  3. Allow USB debugging prompt on phone
  4. Run `adb kill-server` then `adb devices`

### "Device unauthorized"
- **Solution**: 
  1. Revoke USB debugging on phone
  2. Reconnect and allow again
  3. Check "Always allow from this computer"

### scrcpy shows black screen
- **Solution**: 
  1. Try: `scrcpy --stay-awake`
  2. Check if phone screen is locked (unlock it)
  3. Try: `scrcpy --turn-screen-off` (mirrors but keeps phone screen off)

---

## Best Method for Expo Development 🎯

**Recommended: scrcpy + Expo Dev Tools**

1. **Use scrcpy** to see phone screen on laptop
2. **Use Expo Dev Tools** (Chrome inspect) for logs/debugging
3. **Best of both worlds!**

---

## Pro Tips 💡

1. **Wireless is slower** - Use USB for best performance
2. **scrcpy is free** - No watermarks, best quality
3. **Record screen**: `scrcpy --record screen.mp4`
4. **Control from laptop**: Click/drag on mirrored screen
5. **Multiple devices**: `scrcpy -s <device-id>` (get ID from `adb devices`)

---

## Quick Commands Reference 📝

```powershell
# Check connected devices
adb devices

# Start screen mirroring
scrcpy

# Record screen
scrcpy --record screen.mp4

# Wireless connection
adb tcpip 5555
adb connect <phone-ip>:5555

# Kill ADB server (if stuck)
adb kill-server
adb start-server
```

---

## Download Links 🔗

- **scrcpy**: https://github.com/Genymobile/scrcpy/releases
- **ADB (Platform Tools)**: https://developer.android.com/studio/releases/platform-tools
- **Vysor**: https://www.vysor.io/

---

## Need Help? 🤔

If you get stuck:
1. Check USB cable (must support data transfer)
2. Enable Developer Options (tap Build Number 7 times)
3. Enable USB Debugging
4. Allow USB debugging prompt on phone
5. Try `adb kill-server` then reconnect

