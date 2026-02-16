# How to run the Book My Doc app

## 1. Backend (API)

From the **doctor-web** folder:

```bash
cd doctor-web
npm install
npm run start:dev
```

Backend runs at **http://localhost:8080**. API base: **http://localhost:8080/api**.

---

## 2. App frontend (doctor-app)

From the **doctor-app** folder:

```bash
cd doctor-app
npm install
```

Set the API URL in **two places** (so emulator/real device can reach the backend):

1. **doctor-app/.env** — set `API_BASE_URL=...`
2. **doctor-app/store/api/api.js** — in development, Android uses the URL around line 19. Update the IP/host there to match your setup (e.g. `10.0.2.2` for Android emulator, or your PC’s IP for a real device).

| Run on          | URL to use (in both .env and api.js for Android dev)              |
| --------------- | ----------------------------------------------------------------- |
| **Emulator**    | `http://10.0.2.2:8080/api` (Android)                              |
| **Emulator**    | `http://localhost:8080/api` (iOS)                                 |
| **Real device** | `http://YOUR_PC_IP:8080/api` (e.g. `http://192.168.1.5:8080/api`) |

Then start the app:

```bash
npm run android
```

Or for iOS: `npm run ios`.

---

## Summary

| Step    | Where      | Command                            |
| ------- | ---------- | ---------------------------------- |
| Backend | doctor-web | `npm run start:dev`                |
| App     | doctor-app | `npm run android` or `npm run ios` |

**Real device:** Phone and PC must be on the same Wi‑Fi. Use your PC’s IPv4 (e.g. from `ipconfig` on Windows) in both `.env` and `store/api/api.js`. Restart the app after changing either (e.g. `npx expo start -c` then reopen the app).
