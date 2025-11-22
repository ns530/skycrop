# Mobile App Assets

## Required Assets for Expo Build

### 1. App Icon

**File:** `icon.png`

- **Size:** 1024x1024 pixels
- **Format:** PNG
- **Requirements:**
  - Square image
  - No transparency (or solid background)
  - High resolution
  - Represents your app brand

### 2. Splash Screen

**File:** `splash.png`

- **Size:** 1284x2778 pixels (iPhone 14 Pro Max)
- **Format:** PNG
- **Requirements:**
  - Vertical orientation
  - Logo centered
  - Background color should match app theme
  - Will be cropped/scaled for different devices

### 3. Adaptive Icon (Android)

**File:** `adaptive-icon.png`

- **Size:** 1024x1024 pixels
- **Format:** PNG
- **Requirements:**
  - Foreground image only (logo)
  - Will be masked by Android system
  - Safe area: Keep important content in center 66%
  - Can have transparency

---

## 🎨 Creating Assets

### Option 1: Use Design Tool

- **Figma:** https://figma.com
- **Canva:** https://canva.com (has app icon templates)
- **Adobe XD/Illustrator**

### Option 2: Online Generators

- **App Icon Generator:** https://appicon.co
- **Icon Kitchen:** https://icon.kitchen
- **MakeAppIcon:** https://makeappicon.com

### Option 3: Placeholder Images (For Testing)

For quick testing/demo, you can use:

- **Placeholder.com:** `https://via.placeholder.com/1024x1024/16A34A/FFFFFF?text=SkyCrop`
- Download and rename as needed

---

## 🚀 Quick Start for Demo

If you don't have assets ready, create simple placeholders:

### 1. Create Icon (PowerShell)

```powershell
# Download placeholder icon
Invoke-WebRequest -Uri "https://via.placeholder.com/1024x1024/16A34A/FFFFFF?text=SC" -OutFile "mobile/assets/icon.png"
```

### 2. Create Splash

```powershell
# Download placeholder splash
Invoke-WebRequest -Uri "https://via.placeholder.com/1284x2778/16A34A/FFFFFF?text=SkyCrop" -OutFile "mobile/assets/splash.png"
```

### 3. Copy Icon for Adaptive

```powershell
# Copy icon as adaptive icon
Copy-Item "mobile/assets/icon.png" "mobile/assets/adaptive-icon.png"
```

---

## ✅ Verification

Before building, ensure:

- [ ] `icon.png` exists (1024x1024)
- [ ] `splash.png` exists (1284x2778)
- [ ] `adaptive-icon.png` exists (1024x1024)
- [ ] All files are PNG format
- [ ] Images are not corrupt
- [ ] File sizes are reasonable (< 1MB each)

---

## 📐 Design Guidelines

### Color Scheme (SkyCrop Brand)

- **Primary:** Green (#16A34A) - Represents agriculture
- **Secondary:** Blue (#3B82F6) - Represents sky/water
- **Accent:** Yellow (#FACC15) - Represents crops/harvest

### Icon Style

- Simple and recognizable
- Works at small sizes
- Represents paddy fields/crops
- Modern and professional

### Splash Screen

- Centered logo
- Brand colors
- Optional: Loading indicator
- Optional: Tagline "Precision Agriculture"

---

## 🎨 Design Ideas

### Icon Concepts:

1. **Paddy Plant:** Simple rice plant silhouette
2. **Field Grid:** Geometric field pattern
3. **Crop Monitor:** Combination of plant + analytics
4. **SC Monogram:** Stylized "SC" letters
5. **Leaf + Tech:** Natural element with tech feel

### Splash Concepts:

1. Centered logo + app name
2. Logo + "Precision Agriculture" tagline
3. Animated logo (requires video splash)
4. Gradient background + logo

---

## 📱 How Assets Are Used

### icon.png

- Home screen icon
- App drawer
- Settings
- Notifications
- Play Store listing

### splash.png

- First screen users see
- Displays while app loads
- iOS and Android
- Different crops for different sizes

### adaptive-icon.png

- Android-specific
- System applies mask (circle, square, etc.)
- Background color from app.json
- Foreground is your icon

---

## 🔄 Updating Assets

After changing assets:

```bash
# Clear Expo cache
cd mobile
expo start -c

# Or rebuild
eas build --platform android --profile preview
```

---

## ⚠️ Common Issues

### Issue: "Icon is not square"

- Solution: Resize to exactly 1024x1024

### Issue: "Splash screen appears stretched"

- Solution: Keep logo in safe area (center 50%)

### Issue: "Android icon looks wrong"

- Solution: Check adaptive-icon safe area (center 66%)

### Issue: "Build fails: Assets not found"

- Solution: Verify files exist in `mobile/assets/`

---

## 🎯 Current Status

**Assets Status:**

- [ ] icon.png - NOT CREATED YET
- [ ] splash.png - NOT CREATED YET
- [ ] adaptive-icon.png - NOT CREATED YET

**Action Required:**
Create these assets before running `eas build`

**Quick Fix for Demo:**
Use placeholder images (see Quick Start above)

---

Need help creating assets? Ask for assistance! 🎨
