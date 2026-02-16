# Setup Guide - Book My Doctor App

This guide will help you set up the mobile app for local development. Each team member needs to configure their own local IP address to connect the mobile app to the backend server running on their machine.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Finding Your Local IP Address](#finding-your-local-ip-address)
- [Configuring the Mobile App](#configuring-the-mobile-app)
- [Configuring the Backend](#configuring-the-backend)
- [Running the App](#running-the-app)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development) or Xcode (for iOS development)
- Git

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Bookmydoc-1
```

### 2. Install Dependencies

#### Mobile App (doctor-app)
```bash
cd doctor-app
npm install
```

#### Backend (doctor-web)
```bash
cd doctor-web
npm install
```

## Finding Your Local IP Address

Your mobile app needs to connect to your backend server using your computer's local IP address. Here's how to find it:

### Windows

1. Open Command Prompt (press `Win + R`, type `cmd`, press Enter)
2. Run the command: `ipconfig`
3. Look for **"Wireless LAN adapter Wi-Fi"** section
4. Find the **"IPv4 Address"** - this is your local IP
   - Example: `IPv4 Address. . . . . . . . . . . : 192.168.1.100`

### macOS

1. Open Terminal (press `Cmd + Space`, type `terminal`, press Enter)
2. Run the command: `ifconfig`
3. Look for the **"en0"** section (Wi-Fi interface)
4. Find the line starting with **"inet"** (not inet6)
   - Example: `inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255`

### Linux

1. Open Terminal
2. Run the command: `ip addr` or `ifconfig`
3. Look for your Wi-Fi network interface (usually `wlan0` or `wlp2s0`)
4. Find the line starting with **"inet"**
   - Example: `inet 192.168.1.100/24 brd 192.168.1.255 scope global dynamic wlan0`

**Important Notes:**
- Use your **Wi-Fi IPv4 address** (not Ethernet, not IPv6)
- Common formats: `192.168.x.x` or `10.0.0.x` or `172.16.x.x`
- Your IP address may change if you reconnect to Wi-Fi or restart your router

## Configuring the Mobile App

### 1. Create .env File

Navigate to the `doctor-app` folder and create a `.env` file from the template:

```bash
cd doctor-app
cp .env.example .env
```

On Windows:
```cmd
copy .env.example .env
```

### 2. Edit .env File

Open the `.env` file and update the `LOCAL_IP` with your IP address:

```env
# BEFORE (template)
LOCAL_IP=192.168.1.XXX

# AFTER (your actual IP)
LOCAL_IP=192.168.1.100
```

**Full example configuration:**

```env
APP_ENV=production

# Local Development Settings
LOCAL_IP=192.168.1.100
API_PORT=8080
API_URL=http://192.168.1.100
API_BASE_URL=http://192.168.1.100:8080/api

# Firebase Configuration (get these from your project lead)
APP_FIREBASE_API_KEY=AIzaSy...
APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# ... rest of Firebase config
```

### 3. Update google-services.json (Android only)

Get the `google-services.json` file from your project lead and place it in the `doctor-app` folder.

## Configuring the Backend

### 1. Create .env File

Navigate to the `doctor-web` folder and create a `.env` file:

```bash
cd doctor-web
cp .env.example .env
```

### 2. Edit .env File

The backend should use `HOSTNAME=0.0.0.0` to accept connections from all network interfaces:

```env
HOSTNAME=0.0.0.0
PORT=8080
NODE_ENV=development
```

**Important:** The backend listens on `0.0.0.0:8080`, which means it accepts connections from any IP address. Your mobile app will connect using your local IP (e.g., `192.168.1.100:8080`).

## Running the App

### 1. Start the Backend Server

Open a terminal in the `doctor-web` folder:

```bash
cd doctor-web
npm run start:dev
```

You should see:
```
🚀 [Server] Running on http://0.0.0.0:8080
```

### 2. Start the Mobile App

Open another terminal in the `doctor-app` folder:

#### For Android Emulator:
```bash
cd doctor-app
npm run android
```

#### For iOS Simulator (Mac only):
```bash
cd doctor-app
npm run ios
```

#### For Development Server Only:
```bash
cd doctor-app
npm run start:dev
```

### 3. Verify Connection

When the app starts, you should see logs like:
```
✅ [FIREBASE] Firebase app initialized successfully
✅ [GOOGLE SIGN-IN] Configuration completed successfully
```

If you see connection errors, check the [Troubleshooting](#troubleshooting) section.

## Troubleshooting

### Issue: "Request timeout" or "Connection failed"

**Symptoms:**
```
WARN [API] Request timeout: POST /auth/login
WARN [API] Request was canceled (e.g. timeout or abort)
```

**Solutions:**

1. **Verify your IP address is correct:**
   - Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) again
   - Make sure you're using your **Wi-Fi** IP, not Ethernet
   - Update the `LOCAL_IP` in `doctor-app/.env`

2. **Check backend is running:**
   - Make sure you see `🚀 [Server] Running on http://0.0.0.0:8080`
   - Try accessing `http://localhost:8080/api/facts` in your browser

3. **Check firewall settings:**
   - Your firewall might be blocking connections on port 8080
   - On Windows: Allow Node.js through Windows Firewall
   - On Mac: System Preferences > Security & Privacy > Firewall > Allow Node

4. **Restart Metro bundler:**
   - Press `r` in the Metro bundler terminal to reload
   - Or restart the app completely: `npm run android` or `npm run ios`

### Issue: "Cannot find module 'ExponentAV'" or similar module errors

**Solution:**
1. Clear Metro bundler cache:
   ```bash
   cd doctor-app
   npx expo start --clear
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Issue: IP Address Changed

If your computer's IP address changes (after reconnecting to Wi-Fi or router restart):

1. Find your new IP address (see [Finding Your Local IP Address](#finding-your-local-ip-address))
2. Update `LOCAL_IP` in `doctor-app/.env`
3. Reload the app (press `r` in Metro bundler)

### Issue: Android Emulator Can't Connect

**Symptoms:**
- iOS simulator works fine
- Android emulator shows timeout errors

**Solutions:**

1. **Make sure you're NOT using `localhost` or `127.0.0.1`:**
   - Android emulators cannot use `localhost` to reach your host machine
   - You **must** use your actual Wi-Fi IP address

2. **Try the special Android IP (alternative):**
   - Android emulators can use `10.0.2.2` as an alias for the host machine
   - Update `LOCAL_IP=10.0.2.2` in `.env`
   - However, using your actual Wi-Fi IP is recommended for consistency

3. **Check emulator network settings:**
   - Make sure the emulator has network connectivity
   - Try opening a web browser in the emulator

### Issue: CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
- Make sure your backend `.env` has `NODE_ENV=development`
- In development mode, CORS allows all origins
- Restart the backend server after changing `.env`

## Platform-Specific Notes

### Android Emulator
- **Must** use your Wi-Fi IP address (e.g., `192.168.1.100`)
- Cannot use `localhost` or `127.0.0.1`
- Alternative: Use `10.0.2.2` as a special alias for the host machine

### iOS Simulator
- Can use `localhost` (handled automatically in the code)
- If `localhost` doesn't work, use your Wi-Fi IP address

### Physical Devices
- **Must** use your Wi-Fi IP address
- Make sure your phone and computer are on the **same Wi-Fi network**
- Check firewall settings on your computer

## Environment Variables Reference

### Mobile App (doctor-app/.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ENV` | Environment mode | `production` or `development` |
| `LOCAL_IP` | Your computer's Wi-Fi IP | `192.168.1.100` |
| `API_PORT` | Backend server port | `8080` |
| `API_URL` | Base URL without port | `http://192.168.1.100` |
| `API_BASE_URL` | Full API endpoint | `http://192.168.1.100:8080/api` |

### Backend (doctor-web/.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `HOSTNAME` | Server bind address | `0.0.0.0` |
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment mode | `development` |

## Getting Help

If you're still experiencing issues:

1. Check the console output for error messages
2. Verify all environment variables are set correctly
3. Make sure both backend and mobile app are using the same port (default: 8080)
4. Ask your team lead for help

## Additional Resources

- [React Native Environment Variables](https://github.com/goatandsheep/react-native-dotenv)
- [Expo Configuration](https://docs.expo.dev/guides/environment-variables/)
- [Android Emulator Networking](https://developer.android.com/studio/run/emulator-networking)
