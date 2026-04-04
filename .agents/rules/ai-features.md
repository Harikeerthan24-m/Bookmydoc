---
trigger: model_decision
description: Code discipline for LLMs, Voice AI, and prompt management
---

# AI & Gemini API Discipline
1. **Quota-Safe Patterns**: Always cache AI responses where possible. Implement rate limiting to prevent spam and avoid unnecessary duplicate LLM calls in UI render cycles.
2. **Graceful Degradation**: If the AI API fails, times out, or returns an error, the app MUST NOT crash. Provide a standard fallback UI ("Our AI is resting right now, please try again manually").
3. **Prompt Versioning**: Maintain prompts as modular templates. Changing a prompt is a significant code shift. Do not hardcode deep multi-line prompts inside component render paths.
4. **Tool Call Safety**: When executing AI tool calls (e.g., LiveKit calling Firestore), enforce strict programmatic validation on the arguments the LLM outputs before executing database functions.
5. **State Desync Awareness**: With LiveKit/Voice AI, assume WebRTC state can desync. Implement automatic UI fallback timeouts (e.g., nudge UI out of `INITIALIZING` if the socket drops the 'listening' state).