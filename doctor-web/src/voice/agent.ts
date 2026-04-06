/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck — run by tsx/node --import tsx, NOT compiled by NestJS tsc.

import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

import {
  JobContext,
  WorkerOptions,
  cli,
  voice,
  defineAgent,
  llm,
} from '@livekit/agents';
import { z } from 'zod';
import * as openai from '@livekit/agents-plugin-openai';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Let dotenv auto-resolve from process.cwd() (which is the doctor-web root)
dotenv.config();

import * as admin from 'firebase-admin';

function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  return admin;
}

import {
  searchDoctorsInFirestore,
  persistVoiceChatHistory,
} from './agent.helpers';

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
      tools: {
        find_doctors: llm.tool({
          description:
            'Search for doctors based on a specialty once you have enough symptoms to recommend one. IMPORTANT: Call this function when you officially recommend a specialist so the UI can show the results.',
          parameters: z.object({
            specialty: z
              .string()
              .describe('The requested specialist type, e.g. Cardiologist'),
          }),
          execute: async ({ specialty }, toolOptions) => {
            try {
              const searchPayload = JSON.stringify({
                type: 'searching_doctors',
                specialty,
              });
              await ctx.room.localParticipant.publishData(
                new TextEncoder().encode(searchPayload),
                { reliable: true },
              );
            } catch (err) {
              // ignore
            }

            const firebase = getFirebaseAdmin();
            const db = firebase.firestore();

            // 1. Fetch real doctors
            const doctors = await searchDoctorsInFirestore(db, specialty);
            const count = doctors.length;

            // 2. Identify the user
            const remoteParticipants = Array.from(
              ctx.room.remoteParticipants.values(),
            );
            const userId = remoteParticipants[0]?.identity;

            // 3. Save exactly the full conversation history locally for ChatScreen to pickup
            if (userId) {
              await persistVoiceChatHistory(
                db,
                userId,
                agent.chatCtx.items,
                specialty,
                doctors,
              );
            }

            try {
              // 4. Send Data Channel message to UI (VoiceScreen RoomInternals listener)
              const payload = JSON.stringify({
                type: 'doctors_found',
                count,
                specialty,
              });
              await ctx.room.localParticipant.publishData(
                new TextEncoder().encode(payload),
                { reliable: true },
              );
            } catch (err) {
              console.error('Failed to notify UI over data channel', err);
            }

            return `I found ${count} real doctors in the ${specialty} specialty. Please briefly tell the user to tap the chat notification popup on their screen to see them!`;
          },
        }),
      },
    });

    const session = new voice.AgentSession({});
    await session.start({ agent, room: ctx.room });
  },
});

// Pass credentials explicitly so they're available even if dotenv timing is off.
// node --import tsx propagates the loader to child processes via process.execArgv,
// so the child can import this TypeScript file directly.
cli.runApp(
  new WorkerOptions({
    agent: join(process.cwd(), 'src', 'voice', 'agent.ts'),
    wsURL: process.env.LIVEKIT_URL,
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
  }),
);
