// @ts-nocheck — run by tsx/node --import tsx, NOT compiled by NestJS tsc.

import { JobContext, WorkerOptions, cli, voice, defineAgent } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Let dotenv auto-resolve from process.cwd() (which is the doctor-web root)
dotenv.config();

const INSTRUCTIONS = `
  You are a professional healthcare assistant for BookMyDoc. 
  Your goal is to help patients triage their symptoms and recommend the right kind of specialist.
  
  CRITICAL RULES:
  - ALWAYS speak strictly in English. NEVER switch to another language or hallucinate foreign words.
  - If you hear background noise or silence, do not make up words and ask "Are you still there?".
  
  Guidelines:
  1. Be empathetic, professional, and clear.
  2. Ask clarifying questions about symptoms (duration, severity, etc.).
  3. Based on the symptoms, suggest a specialist (e.g., Cardiologist, Dermatologist, etc.).
  4. Remind the user that you are an AI assistant and they should consult a real doctor for a final diagnosis.
  5. If the user mentions an emergency (e.g., chest pain, severe bleeding), tell them to call emergency services immediately.
  6. Keep your responses concise for a better voice experience.
  7. Start by greeting the user warmly and asking how you can help them today.
`.trim();



/**
 * LiveKit Voice Agent for BookMyDoc — v1.x API
 *
 * The default export MUST be an Agent generator object: { entry: async (ctx) => { ... } }.
 * LiveKit provides defineAgent() to construct this object properly.
 */
export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();

    const agent = new voice.Agent({
      instructions: INSTRUCTIONS,
      llm: new openai.realtime.RealtimeModel({
        voice: 'alloy',
      }),
    });

    const session = new voice.AgentSession({});
    await session.start({ agent, room: ctx.room });
  }
});


// Pass credentials explicitly so they're available even if dotenv timing is off.
// node --import tsx propagates the loader to child processes via process.execArgv,
// so the child can import this TypeScript file directly.
cli.runApp(
  new WorkerOptions({
    agent: __filename,
    wsURL: process.env.LIVEKIT_URL,
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
  }),
);
