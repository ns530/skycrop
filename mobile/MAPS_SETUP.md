# 🗺️ React Native Maps Setup Guide

## Overview

This guide will help you set up Google Maps for the SkyCrop mobile application.

---

## 📱 Prerequisites

1. **Google Cloud Console Account**: https://console.cloud.google.com/
2. **Billing Enabled** (required for Maps API)
3. **Android Studio** (for Android development)
4. **Xcode** (for iOS development, macOS only)

---

## 🔑 Step 1: Get Google Maps API Keys

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name it "SkyCrop Mobile"
4. Click "Create"

### 2. Enable Required APIs

1. In your project, go to "APIs & Services" > "Library"
2. Search and enable these APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Geocoding API** (optional, for address lookup)
   - **Places API** (optional, for place search)

### 3. Create API Keys

#### For Android:

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Click "Restrict Key"
4. Name it "SkyCrop Android"
5. Under "Application restrictions":
   - Select "Android apps"
   - Click "Add an item"
   - Package name: `com.skycropmobile` (or your package name)
   - SHA-1 certificate fingerprint: Get it using:
     ```bash
     cd android
     ./gradlew signingReport
     ```
6. Under "API restrictions":
   - Select "Restrict key"
   - Select "Maps SDK for Android"
7. Click "Save"

#### For iOS:

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Click "Restrict Key"
4. Name it "SkyCrop iOS"
5. Under "Application restrictions":
   - Select "iOS apps"
   - Add your iOS bundle ID: `org.reactjs.native.example.SkyCropMobile` (or your bundle ID)
6. Under "API restrictions":
   - Select "Restrict key"
   - Select "Maps SDK for iOS"
7. Click "Save"

---

## 🔧 Step 2: Configure Your Application

### Android Configuration

1. **Add API Key to AndroidManifest.xml**:

   ```xml
   <!-- File: android/app/src/main/AndroidManifest.xml -->
   <meta-data
     android:name="com.google.android.geo.API_KEY"
     android:value="YOUR_ANDROID_API_KEY_HERE"/>
   ```

2. **Update Permissions** (already done):
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   ```

### iOS Configuration

1. **Add API Key to AppDelegate.mm**:

   ```objc
   // File: ios/SkyCropMobile/AppDelegate.mm
   #import <GoogleMaps/GoogleMaps.h>

   - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
   {
     [GMSServices provideAPIKey:@"YOUR_IOS_API_KEY_HERE"];
     // ... rest of the method
   }
   ```

2. **Update Info.plist** (already done):

   ```xml
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>SkyCrop needs access to your location to show your fields on the map.</string>
   ```

3. **Install CocoaPods**:
   ```bash
   cd ios
   pod install
   ```

---

## 🧪 Step 3: Test the Setup

### Run on Android:

```bash
cd mobile
npx react-native run-android
```

### Run on iOS:

```bash
cd mobile
npx react-native run-ios
```

---

## 🌍 Step 4: Environment Variables (Optional)

For security, store API keys in environment variables:

1. Create `.env` file in `mobile/`:

   ```env
   GOOGLE_MAPS_API_KEY_ANDROID=your_android_key
   GOOGLE_MAPS_API_KEY_IOS=your_ios_key
   ```

2. Install `react-native-config`:

   ```bash
   npm install react-native-config
   ```

3. Update `mobile/src/config/env.ts` to load keys from `.env`

---

## 📊 Usage Limits & Pricing

### Free Tier:

- $200 monthly credit (covers ~28,000 map loads)
- After that: $7 per 1,000 map loads

### Best Practices to Save Costs:

1. ✅ Use API key restrictions
2. ✅ Enable billing alerts
3. ✅ Cache map tiles when possible
4. ✅ Use lite mode for static maps

---

## 🔍 Troubleshooting

### Issue: "Authorization failure" on Android

**Solution**: Double-check your package name and SHA-1 fingerprint

### Issue: Maps showing blank on iOS

**Solution**:

- Ensure API key is added to `AppDelegate.mm`
- Run `pod install` in `ios/` directory
- Rebuild the app

### Issue: "This app is not authorized to use Google Maps"

**Solution**:

- Check that the correct APIs are enabled in Google Cloud Console
- Verify API key restrictions match your app bundle ID / package name

---

## 📚 Resources

- [React Native Maps Documentation](https://github.com/react-native-maps/react-native-maps)
- [Google Maps Platform](https://developers.google.com/maps)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

---

## 🎯 Next Steps

After setting up the API keys:

1. Update `AndroidManifest.xml` with your Android API key
2. Update `AppDelegate.mm` with your iOS API key
3. Run the app and test the Create Field screen
4. Enjoy creating fields with maps! 🌾🗺️
