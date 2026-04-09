/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck — run by tsx/node --import tsx, NOT compiled by NestJS tsc.

import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

import * as dns from 'node:dns';

// Force IPv4 first to prevent WebSocket handshake timeouts on cloud providers like Render
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
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
 */
export default defineAgent({
  entry: async (ctx: JobContext) => {
    // Join with auto-subscribe to receive audio immediately
    await ctx.connect(undefined, { autoSubscribe: true });

    // Wait for the user to be present
    const participant = await ctx.waitForParticipant();
    console.log(`[Agent] Ready for ${participant.identity}`);

    const agent = new voice.Agent({
      instructions: INSTRUCTIONS,
      llm: new openai.realtime.RealtimeModel({
        apiKey: process.env.OPENAI_API_KEY,
        voice: 'alloy',
      }),
      tools: {
        find_doctors: llm.tool({
          description:
            'Search for doctors based on a specialty once you have enough symptoms to recommend one.',
          parameters: z.object({
            specialty: z
              .string()
              .describe('The requested specialist type, e.g. Cardiologist'),
          }),
          execute: async ({ specialty }) => {
            const firebase = getFirebaseAdmin();
            const db = firebase.firestore();

            const doctors = await searchDoctorsInFirestore(db, specialty);
            const count = doctors.length;

            if (participant.identity) {
              await persistVoiceChatHistory(
                db,
                participant.identity,
                agent.chatCtx.items,
                specialty,
                doctors,
              );
            }

            // Notify UI
            const payload = JSON.stringify({
              type: 'doctors_found',
              count,
              specialty,
            });
            await ctx.room.localParticipant.publishData(
              new TextEncoder().encode(payload),
              { reliable: true },
            );

            return `I found ${count} doctors in ${specialty}. Tell the user to check their screen!`;
          },
        }),
      },
    });

    const session = new voice.AgentSession({});
    await session.start({ agent, room: ctx.room });
  },
});

import * as http from 'node:http';

if (require.main === module) {
  // Start dummy HTTP server for Render health checks
  const port = process.env.PORT || 10000;
  http
    .createServer((req, res) => {
      res.writeHead(200);
      res.end('OK\n');
    })
    .listen(port, '0.0.0.0');

  cli.runApp(
    new WorkerOptions({
      agent: __filename,
      wsURL: process.env.LIVEKIT_URL,
      apiKey: process.env.LIVEKIT_API_KEY,
      apiSecret: process.env.LIVEKIT_API_SECRET,
      numIdleProcesses: 1, // Keep 1 process warm
      initializeProcessTimeout: 60 * 1000,
      jobMemoryLimitMB: 450,
    }),
  );
}
