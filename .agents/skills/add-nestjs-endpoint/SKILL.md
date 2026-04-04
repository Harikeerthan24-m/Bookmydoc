---
name: Add NestJS Endpoint
description: Adds a secure API endpoint to the backend with Firebase Admin checks and schema validation.
---

# Add NestJS Endpoint

## Purpose
Ensures new API routes in the NestJS backend (`doctor-web/src/`) properly utilize Firebase custom claims, validation via Class-validator, and proper data mapping, preventing database crashes.

## Execution Steps

1. **Ask for Endpoint details**: Path, HTTP method, and which resource it belongs to (e.g., `bookings`, `doctor`, `voice`).
2. **Define the DTO**: Use Class-validator and create a `.dto.ts` file describing exactly what the endpoint expects.
3. **Update the Controller**: Add the appropriate HTTP decorator (`@Get()`, `@Post()`, etc.) and inject the DTO as the `@Body()`.
4. **Ensure Strict Firebase Compatibility**:
   - Remember the `firebase-patterns` rule: Firestore cannot handle `undefined`.
   - Before passing data to your repository/Firebase service layer, aggressively sanitize the object map.
5. **Add Role-Based Access Control (RBAC)**: Ensure the endpoint has decorators for checking user vs doctor roles as required by the security paradigm.
