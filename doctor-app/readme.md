### Environment and secrets

- Run `npm install` (installs `dotenv`; needed so `app.config.js` reads `.env`).
- Copy `doctor-app/.env.example` to `doctor-app/.env` and fill values. **Never commit `.env`.**
- Set `API_URL` and `API_BASE_URL` in `.env` (no hardcoded URLs in code). **On a physical device**, use your machine's LAN IP (e.g. `http://192.168.1.2:8080/api`), not `localhost`. Restart Expo (`npx expo start -c`) after changing `.env`.
- For Android: add `google-services.json` from Firebase Console (it’s gitignored). Use the Web client ID (type 3) for `ANDROID_WEB_CLIENT_ID` in `.env`.

If `.env` or `google-services.json` were ever committed, run:

```bash
git rm --cached doctor-app/.env doctor-web/.env 2>/dev/null; git rm --cached doctor-app/google-services.json doctor-app/GoogleService-Info.plist 2>/dev/null; true
```

Then add fresh secrets only in local `.env` / Firebase files.

### Network troubleshooting ("cannot reach backend")

If you see `[API] Network error - cannot reach backend` or timeout:

1. **Restart Expo with cache clear**  
   Stop Expo, then run `npx expo start -c` (and reopen the app). Config is cached; `.env` changes need a fresh start.

2. **Confirm your machine's IP**  
   - Windows: `ipconfig` → use the IPv4 of your active adapter (e.g. WiFi).  
   - In `.env`, set `API_BASE_URL=http://YOUR_IP:8080/api` (e.g. `http://192.168.1.2:8080/api`). No `localhost` on a physical device.

3. **Allow port 8080 in Windows Firewall**  
   - Windows Security → Firewall → Advanced settings → Inbound Rules → New Rule.  
   - Port → TCP → 8080. Allow the connection. Apply to your active profile (Private/Domain).

4. **Same network**  
   Phone and laptop must be on the same WiFi. Turn off mobile data on the phone when testing.

5. **Backend on 8080**  
   Nest runs on **8080**. Metro (Expo) uses **8081**. The app talks to **8080**; the Expo URL with 8081 is only for the JS bundle.

6. **App uses wrong URL (e.g. 142.93.179.32:3030)**  
   The app reads `API_BASE_URL` from `doctor-app/.env` only. `app.config.js` loads it with `override: true` so no other env (e.g. doctor-web) overrides it. Run `npx expo start -c` from the **doctor-app** directory, then reopen the app.

```
pod 'GoogleUtilities', :modular_headers => true
```

```
pod 'RNDeviceInfo', :path => '../node_modules/react-native-device-info'
```

### To generate all the Android and IOS files
```
npx expo prebuild
```

### Make sure to connect your device or to run your Emulator
```
npx react-native run-android --mode="release"
```

### If you want to sign the APK and publish to Google Play Store.
```
npx react-native build-android --mode=release
```

```
cd android && ./gradlew assembleRelease
```

```
cd android && ./gradlew signingReport
```

### App version Code

```
"appVersionSource": "local"
"appVersionSource": "remote"
"appVersionSource": "inferred"
```