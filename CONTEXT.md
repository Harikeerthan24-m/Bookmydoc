## App Overview
BookmyDoc is a comprehensive doctor appointment booking platform designed for both patients and healthcare providers. It provides a seamless experience for finding doctors, scheduling appointments, and managing medical consultations across mobile and web platforms.

## Platform
- **Mobile**: Android & iOS (developed using React Native + Expo)
- **Web/Backend**: NestJS (API) + React (Frontend Dashboard)

## Tech Stack
- **Backend (NestJS)**:
  - **Framework**: NestJS (Node.js 22+)
  - **Auth**: Firebase Admin SDK
  - **Real-time**: Socket.io / WebSockets
  - **Payments**: Stripe & Razorpay integration
  - **Validation**: Zod + Class-validator
- **Mobile App (React Native)**:
  - **Framework**: Expo (React Native 0.79.6)
  - **State Management**: Redux Toolkit & Redux Persist
  - **Navigation**: React Navigation (Native Stack, Bottom Tabs)
  - **Auth**: Firebase (JS SDK + Native Firebase App/Messaging)
  - **Communication**: Axios & Socket.io-client
- **Web Frontend (React)**:
  - **Framework**: React 18.3
  - **UI Library**: Bootstrap 5 & React-Bootstrap
  - **Icons**: FontAwesome & React Icons
  - **Auth/State**: Firebase Client SDK & Redux Toolkit

## Folder Structure
- `doctor-app/` — React Native mobile application (Expo).
  - `screens/` — UI screens (Auth, Home, Bookings, Profile).
  - `components/` — Shared reusable UI components.
  - `navigation/` — Stack and Tab navigation configuration.
  - `store/` — Redux store, slices, and RTK Query (if used).
  - `services/` — API calls and Firebase service integrations.
  - `utils/` — Helper functions and constants.
- `doctor-web/` — Monorepo containing the NestJS backend and React frontend.
  - `src/` — NestJS backend modules (Booking, Doctor, Availability, Notification, AI, Voice, etc.).
  - `ui/` — React frontend project (CRA-based structure).
    - `ui/src/` — React source code (Components, Pages, Redux).
- `docs/` — Documentation and setup guides.

## Third Party Services
- **Firebase** — Auth, Firestore (via Admin SDK), FCM Push Notifications.
- **Razorpay** — Domestic payment gateway integration.
- **Stripe** — International payment gateway integration.
- **Socket.io** — Real-time booking updates and potentially chat/voice status.
- **Google Sign-In** — Social authentication for mobile and web.

## Key Features
- **Smart Appointment Booking** — Intuitive flow for patients to find and book doctors.
- **Doctor Availability Management** — Granular control for doctors over their schedules.
- **Real-time Notifications** — Push notifications (FCM) and web alerts.
- **Dual Payment Support** — Flexible payment options via Stripe and Razorpay.
- **LiveKit Real-time Voice AI** — Low-latency, full-duplex conversational AI agent (OpenAI Realtime API) that handles symptom triage, queries the DB via tool calls, and passes full transcription history back to the user's Chat interface.
- **Secure Authentication** — Role-based access control (RBAC) via Firebase roles/claims.

## Key Decisions
- **NestJS Architecture** — Chosen for its modularity and scalability compared to plain Express.
- **Expo for Mobile** — Simplifies development, build (EAS), and cross-platform consistency.
  - *Note*: Uses `expo-dev-client` for native module support (e.g., Firebase, Razorpay).
- **Voice to Chat Persistence** — Mapped LiveKit's `chatCtx.items` directly against the Firestore chat schema. This completely merges voice-conversations into text-based chat sessions seamlessly.
- **LiveKit Cloud Agent Deployment** — The voice agent (`doctor-web/agent/`) is deployed to LiveKit Cloud (India West region) via `lk agent deploy`, NOT Render. LiveKit Cloud provides always-on execution with no cold starts. The NestJS backend on Render only issues LiveKit tokens; it does not run the agent.
- **Optimistic Background Pre-fetching (RTK Query)** — Connected LiveKit WebRTC DataChannel events (e.g., `doctors_found`) to dispatch RTK Query `getChatHistory.initiate({ forceRefetch: true })`. This pre-fetches data while the user is reading notifications, resulting in a 0ms loading sensation when they transition to the Chat tab.
- **3-Layer Hybrid Testing Strategy** — Since real microphone/WebRTC automation is unreliable, testing is heavily layered: Isolated Jest Unit Tests for UI helpers & Backend Logic, API Integration Tests, and a strict Manual Audio Testing Profile before production runs.
- **Environment Management** — API URLs configured via `.env` with special handling for Android Emulator host (`10.0.2.2`).

## Known Issues / Things That Broke Before
- **LiveKit Agent State Desyncs**: The OpenAI Realtime API occasionally misses emitting the 'listening' state signal through the LiveKit WebSocket. Fixed using a 4-second local UI timeout inside VoiceScreen to forcibly nudge the UI state out of `INITIALIZING`. 
- **Firestore Schema Strictness**: Trying to read raw `chatCtx.items` from LiveKit crashes Firestore because ToolCall items don't have a `role` field (undefined values are strictly banned). All LiveKit context arrays must heavily filter against `type === 'message'` beforehand.
- **Android Resource Linking**: Missing `iconBackground` color in `colors.xml` caused build failures.
- **Firebase Initialization**: Firebase messaging was being called before initialization in `Layout.js`. Moved to component lifecycle.
- **Package Mismatch**: Android build failed when `build.gradle` namespace didn't match Kotlin file packages (`com.bookmydoctor`).
- **Emulator Connectivity**: API calls failing from Android emulator due to `localhost` vs `10.0.2.2` confusion.
- **LiveKit Voice Agent — Mic Sends Silence (SOLVED)**: Four compounding bugs caused the agent to hear only silence from the mobile mic:
  1. **Wrong `autoSubscribe` type** (`agent/agent.ts`): `ctx.connect(undefined, { autoSubscribe: true })` passes an object as a numeric enum — the internal check `autoSubscribe == 0` fails, so the room connects with `autoSubscribe: false` and never subscribes to any tracks. Fix: `await ctx.connect()` (default is already `SUBSCRIBE_ALL = 0`).
  2. **Missing `inputOptions` on `session.start()`** (`agent/agent.ts`): `AgentSession`'s `RoomIO` media bridge requires `inputOptions: { audioEnabled: true }` to subscribe to the participant's mic track. Without it, `subscribed` stays `false` forever even though the track is published.
  3. **`audio={false}` on `LiveKitRoom`** (`doctor-app/screens/VoiceScreen.js`): The mic was never enabled because `audio={false}` was set. Changed to `audio={true}` so LiveKit internally calls `setMicrophoneEnabled(true)` at `SignalConnected` — the correct moment per LiveKit docs order: `configureAudio → startAudioSession → connect → setMicrophoneEnabled`.
  4. **`useVoiceAssistant` crashing `RoomInternals` silently** (`VoiceScreen.js`): `useVoiceAssistant` is re-exported from `@livekit/components-react` (a web-only library). It crashed the `RoomInternals` component silently on mount, preventing all `useEffect` hooks from running. Removed entirely; `agentState` is hardcoded `null` (UI state is driven by connection state instead).
- **LiveKit Cloud agent deployment**: Agent runs on LiveKit Cloud (not Render). Firebase credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`) must be set as LiveKit Cloud secrets via `lk agent update-secrets` for Firestore search and chat persistence to work. LIVEKIT_* vars must NOT be set as secrets — LiveKit Cloud injects them automatically with internal optimized values.
- **LiveKit Cloud Dockerfile `ca-certificates`**: `node:22-slim` base image doesn't include CA certificates. `@livekit/rtc-node` (Rust binary) needs them for HTTPS region routing. Add `RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates` to Dockerfile.
- **RN 0.79+ console.log not in adb logcat**: React Native 0.79+ no longer forwards `console.log` to `adb logcat`. Logs appear only in the Metro terminal or Hermes DevTools (`j` in Metro). Use `Alert.alert()` for guaranteed-visible debug output on device.

## Do Not Touch
- **Package Namespace**: Do not change `com.bookmydoctor` without updating `google-services.json` and all native Kotlin files simultaneously.
- **Firebase Init Logic**: Keep Firebase initialization in `App.js` and move handlers into `useEffect` to avoid race conditions.

## Current Priorities
- **AI/Voice Integration Refinement** (HIGH PRIORITY).
