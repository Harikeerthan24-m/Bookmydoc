# Android Build Fixes Applied

## Summary
Fixed multiple Android build issues for the React Native Expo app including resource linking errors, package name mismatches, and Firebase initialization problems.

## Issues Fixed

### 1. Missing Icon Background Color Resource
**Error:**
```
ERROR: resource color/iconBackground (aka com.bookmydoctor:color/iconBackground) not found
```

**Fix:**
- Added `iconBackground` color definition to `android/app/src/main/res/values/colors.xml`
- Set color to `#FFFFFF` (white) to match splash screen background

**Files Modified:**
- `doctor-app/android/app/src/main/res/values/colors.xml`

---

### 2. Package Name Mismatch
**Error:**
```
Unresolved reference: R
Unresolved reference: BuildConfig
```

**Root Cause:**
- Kotlin files used package `com.app.BookMyDoctorAppointment`
- `build.gradle` defined namespace as `com.bookmydoctor`
- This mismatch caused `R` and `BuildConfig` to be unresolved

**Fix:**
- Updated `MainActivity.kt` package from `com.app.BookMyDoctorAppointment` to `com.bookmydoctor`
- Updated `MainApplication.kt` package from `com.app.BookMyDoctorAppointment` to `com.bookmydoctor`
- Moved files from `com/app/BookMyDoctorAppointment/` to `com/bookmydoctor/` directory
- Removed old package directory

**Files Modified:**
- `doctor-app/android/app/src/main/java/com/bookmydoctor/MainActivity.kt` (moved & updated)
- `doctor-app/android/app/src/main/java/com/bookmydoctor/MainApplication.kt` (moved & updated)

---

### 3. Firebase Initialization Error
**Error:**
```
Error: No Firebase App '[DEFAULT]' has been created - call firebase.initializeApp()
```

**Root Cause:**
- `google-services.json` contained old package name `com.app.BookMyDoctorAppointment`
- React Native Firebase auto-initializes from `google-services.json`, but couldn't find matching package
- Firebase messaging handlers were called at module level before Firebase initialization

**Fix:**
1. Updated `google-services.json`:
   - Changed all instances of `com.app.BookMyDoctorAppointment` to `com.bookmydoctor`
   - Updated in `client_info.android_client_info.package_name`
   - Updated in all `oauth_client[].android_info.package_name` entries

2. Added Firebase initialization check in `App.js`:
   - Imported `@react-native-firebase/app`
   - Added logging to verify Firebase initialization
   - Ensures Firebase is available before Layout component loads

3. Moved Firebase messaging handlers from module-level to component-level in `Layout.js`:
   - Moved `messaging().getInitialNotification()` into useEffect
   - Moved `messaging().onNotificationOpenedApp()` into useEffect
   - Moved `messaging().setBackgroundMessageHandler()` into useEffect
   - Added error handling for messaging operations
   - Ensures handlers are only called after Firebase is initialized

**Files Modified:**
- `doctor-app/google-services.json`
- `doctor-app/android/app/google-services.json` (copied)
- `doctor-app/App.js`
- `doctor-app/Layout.js`

---

## Build Steps Performed

1. Added missing color resource
2. Fixed package name in Kotlin files
3. Cleaned Gradle build cache: `./gradlew clean`
4. Updated Firebase configuration files
5. Moved Firebase messaging initialization to proper lifecycle

---

## Verification

To verify the fixes work:

1. Kill any processes on port 8081: `taskkill /PID <PID> /F`
2. Clean build: `cd android && ./gradlew clean`
3. Run build: `npm run android`

The app should now:
- ✅ Build successfully without resource errors
- ✅ Compile Kotlin files without reference errors
- ✅ Initialize Firebase properly from google-services.json
- ✅ Handle Firebase messaging without initialization errors

---

## Important Notes

### Package Name Consistency
Ensure all configuration files use `com.bookmydoctor`:
- `android/app/build.gradle` → `namespace "com.bookmydoctor"`
- `google-services.json` → `package_name: "com.bookmydoctor"`
- Kotlin files → `package com.bookmydoctor`
- `AndroidManifest.xml` → Uses `.MainActivity` relative to namespace

### Firebase Configuration
- React Native Firebase (`@react-native-firebase/app`) auto-initializes from native config files
- No need to call `firebase.initializeApp()` in JavaScript for native modules
- Always call Firebase native methods inside React components, not at module level
- The JS SDK (`firebase` package) in `firebaseConfig.js` is separate and used for auth only

### Future Updates
If you need to change the package name again:
1. Update `android/app/build.gradle` namespace
2. Update all Kotlin file packages
3. Move files to matching directory structure
4. Update `google-services.json` (or download new one from Firebase Console)
5. Clean and rebuild

---

## Date Applied
February 14, 2026
