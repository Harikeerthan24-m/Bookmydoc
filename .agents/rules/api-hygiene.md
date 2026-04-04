---
trigger: always_on
description: Guidelines for secure, resilient, and robust API integration
---

# API Hygiene
1. **Always Handle States**: Every async API call linked to a UI must expose and handle 3 distinct states: `loading`, `error`, and `success`. Never leave the user guessing if an action is processing.
2. **Retry Logic**: Implement retry mechanisms for critical network requests (e.g., via exponential backoff or RTK Query built-in `retry` utility).
3. **Error Boundaries & Resilience**: Wrap major UI sections in React Error Boundaries to prevent entire app crashes from unhandled component-level network/data errors.
4. **Consistent Error Handling**: Do not silently catch errors with empty `catch` blocks. Log them appropriately and return friendly, sanitized error messages to the frontend.