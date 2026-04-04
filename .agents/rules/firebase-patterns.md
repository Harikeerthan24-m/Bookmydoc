---
trigger: always_on
description: Strict rules for interacting with Firebase services safely and cleanly
---

# Firebase Patterns
1. **No Raw Reads in Components**: Never call `firestore().collection(...)` directly inside a React or React Native view component. 
2. **Service Layer Abstraction**: All Firebase logic (queries, writes, auth checks) must be abstracted behind a specific `services/firebaseService.ts` or scoped repository files.
3. **Referential Integrity**: Firestore has strict schema enforcement in Node/JS SDKs. Undefined values crash the system (e.g., LiveKit context mapping). Always sanitize objects (remove `undefined`) before Firestore write/update operations.
4. **Security & Auth**: Always respect RBAC via Firebase custom claims. Validate write payloads and use Firestore batch operations for multi-document writes to maintain atomicity.