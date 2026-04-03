// @ts-nocheck — run by tsx/node --import tsx, NOT compiled by NestJS tsc.

import { JobContext, WorkerOptions, cli, voice, defineAgent, llm } from '@livekit/agents';
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
          description: "Search for doctors based on a specialty once you have enough symptoms to recommend one. IMPORTANT: Call this function when you officially recommend a specialist so the UI can show the results.",
          parameters: z.object({
            specialty: z.string().describe("The requested specialist type, e.g. Cardiologist")
          }),
          execute: async ({ specialty }, toolOptions) => {
            try {
              const searchPayload = JSON.stringify({ type: 'searching_doctors', specialty });
              await ctx.room.localParticipant.publishData(new TextEncoder().encode(searchPayload), { reliable: true });
            } catch (err) {
              // ignore
            }

            const firebase = getFirebaseAdmin();
            const db = firebase.firestore();
            
            // 1. Fetch real doctors
            const snapshot = await db.collection('profiles')
              .where('role', '==', 'doctor')
              .where('expertiseList', 'array-contains', specialty)
              .limit(5)
              .get();
              
            const doctors = snapshot.docs.map(doc => {
              const d = doc.data();
              return {
                doctorId: doc.id,
                name: d.display_name || 'Doctor',
                specialization: specialty,
                location: d.location?.city || 'Remote',
                rating: d.star_rating || 5,
              };
            });
            const count = doctors.length;

            // 2. Identify the user
            const remoteParticipants = Array.from(ctx.room.remoteParticipants.values());
            const userId = remoteParticipants[0]?.identity;

            // 3. Save conversation history locally for ChatScreen to pickup
              // 3. Save exactly the full conversation history locally for ChatScreen to pickup
            if (userId) {
              const sessionRef = db.collection('chatSessions').doc(userId);
              const messagesRef = sessionRef.collection('messages');

              // Filter out only valid text messages from the AI and User
              const allMessages = agent.chatCtx.items
                .filter(m => m.type === 'message' && typeof m.textContent === 'string' && m.textContent.trim().length > 0);

              let lastUserMsg = `I need a ${specialty}.`;
              
              // We will reconstruct the timeline exactly to preserve chat ordering
              let sequenceMillis = Date.now() - (allMessages.length * 1000); 

              for (const m of allMessages) {
                if (m.role === 'user') lastUserMsg = m.textContent;
                
                const msgTime = new Date(sequenceMillis++);
                const msgId = m.id || `voice-${sequenceMillis}`;
                
                const msgData: any = {
                  role: m.role,
                  content: m.textContent,
                  createdAt: firebase.firestore.Timestamp.fromDate(msgTime),
                };
                if (m.role === 'user') msgData.inputType = 'voice';
                if (m.role === 'assistant') msgData.outputType = 'voice';
                
                await messagesRef.doc(msgId).set(msgData, { merge: true });
              }

              // Also persist a "smart" bubble with the Doctor UI cards
              const finalAsstMsg = `I found ${count} matching doctors for ${specialty}.`;
              
              // Ensure session document exists and reflects the latest summary
              await sessionRef.set({
                userId,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: lastUserMsg,
                lastAssistantMessage: finalAsstMsg,
              }, { merge: true });

              await messagesRef.add({
                role: 'assistant',
                content: finalAsstMsg,
                meta: {
                  extractedInfo: { specialty, conversationStage: 'recommending' },
                  doctorRecommendations: doctors,
                },
                outputType: 'voice',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              });
            }
            
            try {
              // 4. Send Data Channel message to UI (VoiceScreen RoomInternals listener)
              const payload = JSON.stringify({ type: 'doctors_found', count, specialty });
              await ctx.room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
            } catch (err) {
              console.error('Failed to notify UI over data channel', err);
            }
            
            return `I found ${count} real doctors in the ${specialty} specialty. Please briefly tell the user to tap the chat notification popup on their screen to see them!`;
          }
        })
      }
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
