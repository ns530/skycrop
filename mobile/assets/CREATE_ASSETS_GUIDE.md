# Quick Guide: Create Mobile Assets

## 🚨 Network Error Solution

Since placeholder services aren't accessible, here are 3 working methods:

---

## ✅ METHOD 1: Use Paint (Windows Built-in) - 5 minutes

### Step 1: Create Icon (1024x1024)

1. Open **Paint** (search in Windows)
2. Click **Resize** → Enter **1024 x 1024 pixels**
3. Fill with **green color** (#16A34A or any green)
4. Add text "SC" in white (optional)
5. **Save as:** `D:\FYP\SkyCrop\mobile\assets\icon.png`

### Step 2: Create Splash (1284x2778)

1. Open **Paint**
2. Click **Resize** → Enter **1284 x 2778 pixels**
3. Fill with **green color**
4. Add text "SkyCrop" in white (optional)
5. **Save as:** `D:\FYP\SkyCrop\mobile\assets\splash.png`

### Step 3: Copy Adaptive Icon

```powershell
cd D:\FYP\SkyCrop\mobile\assets
Copy-Item icon.png adaptive-icon.png
```

---

## ✅ METHOD 2: Download from Alternative Service

Try these alternative URLs:

```powershell
cd D:\FYP\SkyCrop\mobile\assets

# Try placeholder.com instead
Invoke-WebRequest -Uri "https://placeholder.com/1024x1024/16A34A/FFFFFF" -OutFile "icon.png"
Invoke-WebRequest -Uri "https://placeholder.com/1284x2778/16A34A/FFFFFF" -OutFile "splash.png"
Copy-Item icon.png adaptive-icon.png

# Or try dummyimage.com
Invoke-WebRequest -Uri "https://dummyimage.com/1024x1024/16a34a/fff&text=SC" -OutFile "icon.png"
Invoke-WebRequest -Uri "https://dummyimage.com/1284x2778/16a34a/fff&text=SkyCrop" -OutFile "splash.png"
Copy-Item icon.png adaptive-icon.png
```

---

## ✅ METHOD 3: Use Existing Images

If you have any PNG images:

```powershell
cd D:\FYP\SkyCrop\mobile\assets

# Copy any existing PNG and rename
Copy-Item "path\to\your\image.png" icon.png

# Resize using ImageMagick (if installed) or just use as-is
# Expo will resize automatically
```

---

## ✅ METHOD 4: Create Minimal PNG Files

Create the smallest valid PNG files (will work for testing):

```powershell
cd D:\FYP\SkyCrop\mobile\assets

# Create minimal valid PNG files (1x1 pixel, will be upscaled)
# Base64 of a tiny green PNG
$iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
[IO.File]::WriteAllBytes("icon.png", [Convert]::FromBase64String($iconBase64))
Copy-Item icon.png splash.png
Copy-Item icon.png adaptive-icon.png
```

---

## 🎨 RECOMMENDED: Use Canva (Best Quality)

### For Production-Ready Assets:

1. **Go to:** https://www.canva.com
2. **Search:** "App Icon" template
3. **Customize:**
   - Size: 1024x1024
   - Color: Green (#16A34A)
   - Add "SC" or rice plant icon
4. **Download as PNG**
5. Save to `D:\FYP\SkyCrop\mobile\assets\`

**For Splash:**

- Search "Mobile App Splash Screen"
- Size: 1284x2778
- Add "SkyCrop" text + tagline

---

## ✅ VERIFY ASSETS EXIST

```powershell
cd D:\FYP\SkyCrop\mobile\assets
dir

# Should see:
# icon.png
# splash.png
# adaptive-icon.png
```

---

## 🚀 QUICK FIX FOR NOW

If you just want to test deployment, create ANY 3 PNG files:

```powershell
cd D:\FYP\SkyCrop\mobile\assets

# Download a simple green image from anywhere
# Or use Paint to create 3 solid green squares
# Names must be: icon.png, splash.png, adaptive-icon.png
# Expo will handle the rest!
```

---

## ⚠️ IMPORTANT

- **Minimum requirement:** 3 PNG files with correct names
- **Sizes can be approximate** - Expo will resize
- **Quality doesn't matter for initial demo**
- **You can replace later** with professional assets

---

## ✅ AFTER CREATING ASSETS

Run this to verify:

```powershell
cd D:\FYP\SkyCrop

# Check assets exist
Test-Path mobile\assets\icon.png
Test-Path mobile\assets\splash.png
Test-Path mobile\assets\adaptive-icon.png

# All should return: True
```

**Then continue with git commands:**

```powershell
git add .
git commit -m "Phase 0: Prepare for production deployment"
git push origin main
```

**Then say: "Start Phase 1"** 🚀
