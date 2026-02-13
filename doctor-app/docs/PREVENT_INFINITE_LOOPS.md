# Preventing Infinite Loops & Stack Overflow Errors

## ✅ What Was Fixed

### 1. **HomeScreen.js - Notification Permission Loop**
**Problem:** `useEffect` depended on `profile?.notification_enabled`, but the effect itself updated the profile, creating an infinite loop.

**Solution:**
- Removed `profile?.notification_enabled` from dependency array
- Added `hasRequestedPermission` ref to prevent duplicate calls
- Effect now runs only once on mount

### 2. **Layout.js - Firebase Auth Listener Leak**
**Problem:** `onAuthStateChanged` was creating new listeners on every render without cleaning them up.

**Solution:**
- Moved auth listener directly into `useEffect`
- Properly returns `unsubscribe()` cleanup function
- Prevents memory leaks and duplicate listeners

### 3. **PaymentScreen.js - Duplicate useEffect**
**Problem:** Two `useEffect` hooks doing the same work.

**Solution:**
- Merged into single `useEffect`
- Proper cleanup of mutation results

---

## 🚫 Common Patterns That Cause Infinite Loops

### 1. **State Updates in useEffect Dependencies**
```javascript
// ❌ BAD - Infinite loop
useEffect(() => {
  dispatch(updateProfile(data)); // Updates profile
}, [profile]); // Triggers when profile changes

// ✅ GOOD - Runs only when needed
useEffect(() => {
  dispatch(updateProfile(data));
}, []); // Or specific conditions
```

### 2. **Firebase Listeners Without Cleanup**
```javascript
// ❌ BAD - Creates new listener each render
useEffect(() => {
  auth.onAuthStateChanged((user) => {
    // handle user
  });
}, [dependency]);

// ✅ GOOD - Properly cleans up
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    // handle user
  });
  return () => unsubscribe();
}, [dependency]);
```

### 3. **Query/API Calls That Trigger Re-renders**
```javascript
// ❌ BAD - Refetches infinitely
useEffect(() => {
  const { data } = useGetDataQuery({ refresh: appRefresh });
}, [data]); // data changes -> refetch -> data changes -> refetch...

// ✅ GOOD - Controlled fetching
const { data } = useGetDataQuery({ 
  refresh: appRefresh 
}); // Query manages its own lifecycle
```

### 4. **Refs in Dependency Arrays**
```javascript
// ❌ BAD - useCallback changes on every render
const callback = useCallback(() => {
  // do something
}, [someRef.current]); // Refs are mutable

// ✅ GOOD - Empty deps if ref is used internally
const callback = useCallback(() => {
  // Access someRef.current inside
}, []); // Stable reference
```

---

## ✅ Best Practices Checklist

### Before Adding useEffect:
- [ ] Does this effect update state it depends on?
- [ ] Do I need cleanup (unsubscribe, clear timers)?
- [ ] Can I use `useCallback` or `useMemo` instead?
- [ ] Are my dependencies correct (not missing, not extra)?

### When Using Redux/RTK Query:
- [ ] Don't put query results in dependency arrays
- [ ] Use `skip` parameter for conditional fetching
- [ ] Don't dispatch actions that update the dependencies

### When Using Firebase:
- [ ] Always return cleanup functions for listeners
- [ ] Use refs to prevent duplicate calls
- [ ] Don't create new listeners on re-renders

### General React Rules:
- [ ] Use ESLint plugin: `eslint-plugin-react-hooks`
- [ ] Enable exhaustive deps warnings
- [ ] Test component mount/unmount cycles
- [ ] Check React DevTools for excessive re-renders

---

## 🔍 How to Debug

### 1. Add Console Logs
```javascript
useEffect(() => {
  console.log('Effect running', { dependency1, dependency2 });
  // your code
}, [dependency1, dependency2]);
```

### 2. Use React DevTools Profiler
- Look for components rendering repeatedly
- Check "Why did this render?" 

### 3. Check Redux DevTools
- Look for actions dispatched in rapid succession
- Identify which actions trigger re-renders

### 4. Use `why-did-you-render` Library
```bash
npm install @welldone-software/why-did-you-render
```

---

## 📚 Additional Resources

- [React Hooks FAQ](https://react.dev/reference/react/hooks)
- [RTK Query Best Practices](https://redux-toolkit.js.org/rtk-query/usage/queries)
- [Firebase Listeners Guide](https://firebase.google.com/docs/firestore/query-data/listen)

---

## 🆘 If You Get Stack Overflow Error Again

1. **Check recent changes** - What useEffect/useCallback did you add/modify?
2. **Look at the stack trace** - Which component is repeating?
3. **Check dependencies** - Are you updating what you're watching?
4. **Add guards** - Use refs to prevent duplicate operations
5. **Review this guide** - Match against common patterns above

---

**Last Updated:** 2026-02-11
**Maintained by:** Development Team
