---
trigger: always_on
description: Enforces component design patterns, focusing on reusability and separating logic from UI
---

# Component Design Rules
1. **Small & Focused Components**: Components should be small and focused on a single visual responsibility. If a component grows beyond 150-200 lines, extract sub-components.
2. **Strict Prop Types**: All components must comprehensively define prop types using TypeScript interfaces or PropTypes in JS.
3. **No Logic Leakage**: Components determine *how* things look, not *what* happens. Extract heavy business logic into custom hooks (`useFeature.ts`) or service functions. The component should primarily return JSX and call handler functions.
4. **Reusability First**: Build UI elements (buttons, inputs, cards) as generic reusable components using the core design system. Avoid inline styles or local ad-hoc utilities when a global component exists.