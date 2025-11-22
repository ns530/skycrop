# SkyCrop Mobile

Cross-platform mobile application for SkyCrop - Smart Paddy Field Management System

Built with React Native, TypeScript, and React Navigation

## 📱 Features

- ✅ **Authentication** - Email/password login with JWT
- ✅ **Field Management** - View, create, and manage paddy fields
- ✅ **Health Monitoring** - Real-time crop health with NDVI/NDWI/TDVI
- ✅ **Recommendations** - AI-powered farming recommendations
- ✅ **Weather Forecasts** - 5-day weather predictions
- ✅ **Yield Predictions** - ML-based yield forecasting
- ✅ **Push Notifications** - Firebase Cloud Messaging for alerts
- ✅ **Offline Mode** - AsyncStorage + MMKV for caching
- ✅ **Maps Integration** - React Native Maps for field visualization

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- React Native CLI
- Android Studio (for Android development)
- Xcode 14+ (for iOS development, macOS only)
- CocoaPods (for iOS dependencies)

### Installation

```bash
# Install dependencies
cd mobile
npm install

# iOS only - install pods
cd ios && pod install && cd ..
```

### Configuration

1. **Environment Setup:**
   - Copy Firebase configuration files:
     - Android: `google-services.json` → `mobile/android/app/`
     - iOS: `GoogleService-Info.plist` → `mobile/ios/`
   - Update API URL in `src/config/env.ts` if needed

2. **Android Setup:**

   ```bash
   # Create local.properties
   echo "sdk.dir=/path/to/Android/Sdk" > android/local.properties
   ```

3. **iOS Setup:**
   ```bash
   cd ios
   pod install
   ```

### Running the App

```bash
# Android
npm run android

# iOS
npm run ios

# Start Metro bundler
npm start
```

## 📂 Project Structure

```
mobile/
├── src/
│   ├── api/              # API clients and HTTP requests
│   │   ├── client.ts     # Axios instance with interceptors
│   │   └── authApi.ts    # Authentication endpoints
│   ├── components/       # Reusable UI components
│   ├── config/           # App configuration
│   │   ├── env.ts        # Environment variables
│   │   └── firebase.ts   # Firebase config
│   ├── context/          # React contexts
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # React Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── FieldsNavigator.tsx
│   ├── screens/          # Screen components
│   │   ├── auth/         # Login, Register, ForgotPassword
│   │   ├── dashboard/    # Dashboard
│   │   ├── fields/       # Field management screens
│   │   ├── weather/      # Weather screens
│   │   └── profile/      # Profile and settings
│   ├── store/            # State management (future)
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── App.tsx           # Root component
├── android/              # Android native code
├── ios/                  # iOS native code
├── assets/               # Images, fonts, etc.
└── package.json
```

## 🛠️ Tech Stack

### Core

- **React Native** 0.74.5
- **TypeScript** 5.6+
- **React** 18.3.1

### Navigation

- **@react-navigation/native** - Navigation framework
- **@react-navigation/stack** - Stack navigator
- **@react-navigation/bottom-tabs** - Tab navigator
- **@react-navigation/drawer** - Drawer navigator

### State Management & Data Fetching

- **@tanstack/react-query** 5.x - Server state management
- **AsyncStorage** - Persistent storage
- **MMKV** - Fast key-value storage
- **Keychain** - Secure credential storage

### Maps & Location

- **react-native-maps** - Native maps
- **react-native-geolocation-service** - GPS location

### Push Notifications

- **@react-native-firebase/app** - Firebase core
- **@react-native-firebase/messaging** - FCM
- **@react-native-firebase/analytics** - Analytics
- **@notifee/react-native** - Local notifications

### UI & Styling

- **react-native-vector-icons** - Icon library
- **react-native-svg** - SVG support
- **react-native-chart-kit** - Charts

### Networking

- **axios** - HTTP client

## 🔐 Authentication Flow

1. User enters credentials on LoginScreen
2. AuthContext calls `authApi.login()` via axios
3. Backend returns JWT token + user data
4. Token stored securely in Keychain (primary) + AsyncStorage (backup)
5. Token auto-included in requests via axios interceptor
6. RootNavigator switches to MainNavigator
7. Token validated on app launch, auto-logout if expired

## 🔔 Push Notifications

### Setup

1. Configure Firebase project with Android & iOS apps
2. Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
3. Enable FCM in Firebase Console
4. Request notification permission on app launch

### Notification Types

- **Health Alerts** - Crop health issues detected
- **Weather Warnings** - Extreme weather alerts
- **Recommendations** - New farming suggestions
- **Yield Updates** - Harvest predictions

### Implementation

- Foreground: Displayed via Notifee
- Background: Handled by Firebase
- Data payloads: Custom navigation on tap

## 📦 Offline Mode

### Cached Data

- **Fields** - Last 30 days of field data
- **Health Records** - Recent NDVI/NDWI/TDVI values
- **Weather** - Last fetched forecast
- **Recommendations** - Recent suggestions

### Storage Strategy

- **AsyncStorage** - User profile, settings
- **MMKV** - Fast access to field data
- **React Query** - Auto stale-while-revalidate

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🏗️ Build & Deployment

### Android

```bash
# Debug build
npm run android

# Release build
cd android
./gradlew assembleRelease

# Generated APK at:
# android/app/build/outputs/apk/release/app-release.apk
```

### iOS

```bash
# Debug build
npm run ios

# Release build (Xcode)
# 1. Open ios/SkyCrop.xcworkspace
# 2. Product → Archive
# 3. Distribute App → App Store Connect
```

## 📱 Supported Platforms

- **Android** - API 26+ (Android 8.0+)
- **iOS** - iOS 13.0+

## 🔧 Troubleshooting

### Common Issues

**Metro Bundler Issues:**

```bash
npm run clean:cache
npm start -- --reset-cache
```

**Android Build Failures:**

```bash
cd android
./gradlew clean
cd ..
npm run android
```

**iOS Pod Issues:**

```bash
cd ios
pod deintegrate
pod install
cd ..
```

**Clear Everything:**

```bash
# Clear watchman
watchman watch-del-all

# Clear Metro
rm -rf $TMPDIR/react-*

# Reinstall
rm -rf node_modules
npm install
cd ios && pod install
```

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributors

SkyCrop Development Team

---

**Status:** 🚧 **In Development** - Sprint 5 (Weeks 13-14)

**Next Steps:**

1. Implement all placeholder screens
2. Add React Native Maps integration
3. Implement offline data sync
4. Add real-time updates via WebSocket
5. Performance optimization
6. End-to-end testing
