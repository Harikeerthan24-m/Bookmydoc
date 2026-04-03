# How the Chatbot Is Implemented and Connected

This doc explains how the AI healthcare chatbot is wired end-to-end: from the app UI to the backend and back.

---

## 1. High-Level Connection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  doctor-app (React Native)                                                  │
│  ChatScreen.js  →  useChatMutation()  →  axiosBaseQuery  →  api.js (axios)  │
└───────────────────────────────────────────────┬─────────────────────────────┘
                                                │
                        POST /api/ai/chat       │  Bearer <Firebase token>
                        Body: { message, conversationHistory?, preferences? }
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  doctor-web (NestJS)                                                        │
│  AuthMiddleware  →  AiController.chat  →  AiService.chat                    │
│       │                      │                    │                          │
│       │                      │                    ├─ chatWithOpenAI (OpenAI)  │
│       │                      │                    ├─ classifySymptoms       │
│       │                      │                    ├─ searchDoctors           │
│       │                      │                    └─ formatDoctorRecommendations
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend (doctor-app)

### 2.1 Where it lives

- **Screen:** `doctor-app/screens/ChatScreen.js`
- **API:** `doctor-app/store/slices/ai.slice.js` (RTK Query)
- **HTTP client:** `doctor-app/store/api/baseQuery.js` + `doctor-app/store/api/api.js`

### 2.2 ChatScreen state and send flow

1. **State**
   - `messageText` – current input
   - `messages` – list of { id, text, isUser } for the UI
   - `conversationHistory` – list of { role, content } sent to the backend
   - `isLoading` – true while waiting for the API

2. **On send (handleSend)**
   - Append user message to `messages` (UI) and to a local `updatedHistory` (role: `'user'`, content: trimmed text).
   - Call:
     - `chatMutation({ message: trimmed, conversationHistory })`
   - On success:
     - Append `response.response` as assistant message to `messages`.
     - Set `conversationHistory` to `response.conversationHistory` (so next request has full context).
   - On error: append an error message to `messages`.

So: **every request sends the latest user message plus the previous conversation history.** The backend returns an updated history; the app stores it for the next call.

### 2.3 How the request is sent

- **Slice:** `ai.slice.js` defines a `chat` mutation:
  - `url: '/ai/chat'`
  - `method: 'POST'`
  - `data`: `{ message, conversationHistory?, preferences? }`
- **baseQuery** (used by the slice):
  - Gets Firebase `accessToken` from Redux (`authSlice.user.accessToken` or `stsTokenManager.accessToken`).
  - Adds header: `Authorization: Bearer ${accessToken}`.
  - Calls `apiClient.request(...)` from `store/api/api.js`.
- **api.js**:
  - `baseURL` is `BASE_URL` from `.env`: e.g. `http://localhost:${API_PORT}/api` or `http://${LOCAL_IP}:${API_PORT}/api`.
  - So the real request is: **POST** `{BASE_URL}/ai/chat` with JSON body and Bearer token.

**Summary:** ChatScreen → `useChatMutation()` → baseQuery (adds auth) → api (BASE_URL) → **POST /api/ai/chat**.

---

## 3. Backend (doctor-web)

### 3.1 Route and auth

- **Route:** `POST /api/ai/chat`
- **Controller:** `doctor-web/src/ai/ai.controller.ts`
- **Guards:** `RolesGuard` + `@Roles(IRole.CUSTOMER, IRole.ADMIN)` so only logged-in customers/admins can call it.
- **Auth:** Token is validated by your auth middleware before the controller; `req.user` (e.g. `uid` / `userId`) is available.

Controller does:

```ts
const result = await this.aiService.chat(dto, userId);
return { statusCode: 200, data: result, message: '...' };
```

So the **chat logic lives entirely in AiService.chat**.

### 3.2 Request body (ChatRequestDto)

- **message** (required): current user message string.
- **conversationHistory** (optional): array of `{ role: 'user' | 'assistant', content: string }`.
- **preferences** (optional): e.g. `{ gender?, location?, minRating? }` (used when searching doctors).

---

## 4. AiService.chat – Backend Logic (step by step)

File: `doctor-web/src/ai/ai.service.ts`, method `chat(dto, userId)`.

### Step 1: Build conversation array

- Start from `dto.conversationHistory` or `[]`.
- Push current turn: `{ role: 'user', content: dto.message }`.
- This array is the “current conversation” for the rest of the flow.

### Step 2: Decide if we have enough to recommend doctors

- **Method:** `shouldSearchDoctors(conversationHistory)`.
- **Rule:**  
  - At least 2 messages in `conversationHistory` (so there was at least one exchange).  
  - At least one user message contains symptom-like words (e.g. pain, cough, fever, headache, …).
- If both are true → `shouldSearchDoctors === true` (we will classify and search doctors later). Otherwise we only reply, no doctor search.

### Step 3: Generate the text reply (AI or fallback)

- If **OPENAI_API_KEY** is set:
  - Call **`chatWithOpenAI(conversationHistory, apiKey, shouldSearchDoctors)`**.
  - Sends to OpenAI Chat Completions (e.g. `gpt-4o-mini`) with a system prompt (healthcare assistant, ask follow-ups, etc.) and the conversation.
  - Returns `{ response, extractedInfo }`. `extractedInfo` can contain location/gender from `extractPatientInfo(conversationHistory)`.
- If OpenAI fails or no key:
  - Use **`getFallbackChatResponse(message, conversationHistory)`** (keyword-based replies).

So the **chatbot reply text** is either OpenAI or the fallback; it does not depend on doctor search.

### Step 4: Get specialists when we’re going to search

- Only if **`shouldSearchDoctors`** is true **and** we don’t already have specialists in `extractedInfo`:
  - Call **`classifySymptoms({ description })`**.
  - Today `description` is the **current message** (`dto.message`). (You can change this to “all user messages joined” for better context.)
  - Result: specialists (e.g. `["General Physician", "Pulmonologist"]`), urgency, summary.
  - Set `extractedInfo.specialists`, `extractedInfo.urgency`, `extractedInfo.summary`.

So **specialist list comes from the same symptom classification used elsewhere (e.g. Ask AI).**

### Step 5: Search doctors and format recommendations

- Only if **`shouldSearchDoctors`** and **`extractedInfo.specialists?.length > 0`**:
  - Call **`searchDoctors(extractedInfo, dto.preferences)`**:
    - Builds filters: **expertise** (from `extractedInfo.specialists`), **gender**, **location** (from extracted info or `dto.preferences`), **minRating**, optional **availability**.
    - Calls **`DoctorService.getDoctors(filters)`** (Firestore: profiles with role doctor, then in-memory filter by expertise, gender, location, rating, etc.).
  - **`formatDoctorRecommendations(doctors, extractedInfo)`** maps each doctor to `{ doctorId, name, specialization, rating, location, reason }`.
  - If we got any doctors, the reply text is extended with a line like “I found N doctors that match your needs…”.

### Step 6: Finish and return

- Push the final assistant reply to `conversationHistory`: `{ role: 'assistant', content: aiResponse }`.
- Return to the controller:
  - **response:** full reply text (including any doctor line).
  - **extractedInfo**
  - **doctorRecommendations** (array or empty)
  - **conversationHistory** (updated)
  - **searchedDoctors:** true if we actually ran search and got at least one doctor.

The **response** is what the app shows as the assistant message; **conversationHistory** is what the app stores and sends on the next turn.

---

## 5. How “Conversation” Is Kept in Sync

- **App:** Keeps `conversationHistory` in ChatScreen state. Each request sends `message` + `conversationHistory`. After each response it replaces `conversationHistory` with `response.conversationHistory`.
- **Backend:** Does not persist chats. It receives history, appends the new user message, generates a reply, optionally runs classification and doctor search, appends the assistant message, and returns the full updated history.

So **the app is the source of truth for conversation history**; the backend is stateless and only uses what the app sends.

---

## 6. Where Key Things Happen (file reference)

| What | Where |
|------|--------|
| User types and sends | `doctor-app/screens/ChatScreen.js` – `handleSend`, `useChatMutation()` |
| HTTP POST /api/ai/chat + auth | `doctor-app/store/slices/ai.slice.js` (chat mutation), `store/api/baseQuery.js`, `store/api/api.js` |
| Base URL | `doctor-app/store/api/api.js` (BASE_URL from .env: API_PORT, LOCAL_IP) |
| Route + auth guard | `doctor-web/src/ai/ai.controller.ts` – POST `chat`, RolesGuard |
| Chat orchestration | `doctor-web/src/ai/ai.service.ts` – `chat()` |
| “Enough info” to search doctors | `doctor-web/src/ai/ai.service.ts` – `shouldSearchDoctors()` |
| Reply text (AI) | `doctor-web/src/ai/ai.service.ts` – `chatWithOpenAI()` → OpenAI API |
| Reply text (fallback) | `doctor-web/src/ai/ai.service.ts` – `getFallbackChatResponse()` |
| Extract location/gender | `doctor-web/src/ai/ai.service.ts` – `extractPatientInfo()` |
| Specialist from symptoms | `doctor-web/src/ai/ai.service.ts` – `classifySymptoms()` (same as Ask AI) |
| Doctor search filters | `doctor-web/src/ai/ai.service.ts` – `searchDoctors()` → DoctorService.getDoctors |
| Filter by expertise/gender/location | `doctor-web/src/doctor/doctor.service.ts` – `getDoctors()`, `isFindFilterDoctor()` |

---

## 7. Data Flow in One Sentence

**App sends latest message + stored conversation history to POST /api/ai/chat; backend adds the user message, generates a reply (OpenAI or fallback), optionally infers specialists and searches doctors by expertise/location/gender, appends the assistant message to the history, and returns the reply plus updated history and optional doctor list; the app shows the reply and saves the new history for the next message.**

That’s how the chatbot logic is implemented and connected end to end.
