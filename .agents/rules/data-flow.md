---
trigger: always_on
description: Data flow rules ensuring separation of concerns
---

# Data Flow Core Rules
1. **Clear Separation**: Never intermingle API fetch calls, heavy data transformation, and UI rendering in the same component. 
2. **Data Fetching Layer**: Handled securely by API services, RTK Query endpoints, or Firebase service functions. A component should ideally only call a hook like `const { data } = useGetDoctorsQuery()`.
3. **Business Logic Layer**: Should exist in Redux slices, custom hooks, or utility scripts—NOT inside `useEffect` blocks in UI components.
4. **Rendering Layer**: The UI React component should be as pure as possible, rendering data passed to it by the logic layer hook.