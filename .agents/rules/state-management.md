---
trigger: always_on
description: Rules for defining and maintaining application state
---

# State Management
1. **Minimal Global State**: Use Redux (or RTK) ONLY for truly global application state (e.g., Auth Session, User Profile, Theme, Global Notifications).
2. **Keep it Local**: Co-locate state as close to where it's used as possible. Use standard React `useState` or `useReducer` for temporary UI toggles, basic form inputs, or modal open/close states.
3. **Avoid Boilerplate**: Leverage Redux Toolkit (RTK) standard abstractions to avoid boilerplate Redux setups. Minimize manual thunks if RTK Query can elegantly handle data caching and synchronization.