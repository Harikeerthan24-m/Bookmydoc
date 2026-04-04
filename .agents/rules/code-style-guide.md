---
trigger: always_on
description: Enforces production-level code quality and file structure conventions
---

# Code Quality Core Rules
1. **Naming Conventions**: Use CamelCase for variables/functions and PascalCase for components/classes. Boolean variables should start with `is`, `has`, or `should`.
2. **Single Responsibility**: Each file and function should do one thing well. Do not pack multiple unrelated utilities or components into a single file. 
3. **No Dead Code**: Remove commented-out code, unused variables, and console logs before committing or concluding an AI generation step.
4. **Consistent File Structure**: Adhere strictly to the established structure documented in `CONTEXT.md`. (e.g., UI components in `components/`, logic in `services/` or `store/`).
5. **Typescript Strictness**: Maintain proper typing wherever TypeScript is used. Avoid the use of `any` and explicitly define interfaces.