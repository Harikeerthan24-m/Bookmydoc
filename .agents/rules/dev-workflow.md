---
trigger: always_on
description: Rules for the AI-assisted development cycle and shipping mindset
---

# Dev Cycle & Shipping Mindset
1. **Walking Skeleton First**: Focus on building a thin, end-to-end working path first. Get the data flowing from DB to UI before fully implementing the feature.
2. **Feature Complete Before Polish**: Ensure the business logic works flawlessly before spending hours tweaking CSS animations, colors, or minor paddings. No premature optimization.
3. **Shipping Beats Perfect**: Defer non-blocking issues. If an issue is minor and doesn't break the core UX, log it in `CONTEXT.md` under "Known Issues / Things That Broke Before" and merge the code. Keep moving.
4. **AI-Assisted Workflow Routine**:
   - **Always Update CONTEXT**: After major changes, architectural decisions, or discovering a bug, you MUST update `CONTEXT.md`.
   - **Session Starters**: Read `CONTEXT.md` and related `.agents/rules` before beginning a new functional feature.
   - **Prompt Templates**: Use structured templating for recurring tasks (like adding a new RTK endpoint or new screen).