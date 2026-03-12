import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClassifySymptomsDto } from './dto/classify-symptoms.dto';
import {
  ChatRequestDto,
  ChatResponseDto,
  ChatMessageDto,
  DoctorRecommendationDto,
} from './dto/chat.dto';
import { DoctorService } from '../doctor/doctor.service';
import { FirebaseService } from '../firebase/firebase.service';
import FormData = require('form-data');
import * as admin from 'firebase-admin';

const MEDICAL_SPECIALISTS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Orthopedist',
  'Pediatrician',
  'Gynecologist',
  'Neurologist',
  'Psychiatrist',
  'Ophthalmologist',
  'ENT Specialist',
  'Dentist',
  'Gastroenterologist',
  'Pulmonologist',
  'Endocrinologist',
  'Urologist',
  'Nephrologist',
  'Oncologist',
  'Rheumatologist',
  'Allergist',
  'Physiotherapist',
];

interface ISpecialistRecommendation {
  name: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface IClassificationResult {
  specialists: ISpecialistRecommendation[];
  urgency: 'emergency' | 'urgent' | 'routine';
  summary: string;
}

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly doctorService: DoctorService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async transcribeAudio(file: Express.Multer.File): Promise<{ text: string }> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new HttpException(
        'Voice transcription requires OpenAI API key configuration',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!file || !file.buffer) {
      throw new HttpException('Audio file is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname || 'audio.m4a',
        contentType: file.mimetype || 'audio/m4a',
      });
      formData.append('model', 'whisper-1');

      const response = await fetch(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...formData.getHeaders(),
          },
          body: formData.getBuffer() as unknown as BodyInit,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || `Whisper API error: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!data?.text) {
        throw new Error('No transcription returned');
      }

      return { text: data.text };
    } catch (error) {
      console.error(
        '[AI] Whisper transcription failed:',
        (error as Error)?.message,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        (error as Error)?.message || 'Transcription failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async classifySymptoms(
    dto: ClassifySymptomsDto,
  ): Promise<IClassificationResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      try {
        return await this.classifyWithOpenAI(dto.description, apiKey);
      } catch (error) {
        console.warn(
          '[AI] OpenAI classification failed, using fallback:',
          (error as Error)?.message,
        );
      }
    }

    return this.getFallbackClassification(dto.description);
  }

  /**
   * Text-to-speech for assistant responses (backend TTS).
   * Returns base64-encoded audio (mp3) for the client to play.
   */
  async synthesizeSpeech(text: string): Promise<{
    audioBase64: string;
    mimeType: string;
  }> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new HttpException(
        'Text-to-speech requires OpenAI API key configuration',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!text || !text.trim()) {
      throw new HttpException(
        'Text is required for TTS',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts',
          voice: 'alloy',
          input: text,
          format: 'mp3',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || `OpenAI TTS error: ${response.status}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

      return {
        audioBase64,
        mimeType: 'audio/mpeg',
      };
    } catch (error) {
      console.error('[AI] TTS failed:', (error as Error)?.message);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        (error as Error)?.message || 'Text-to-speech failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async classifyWithOpenAI(
    description: string,
    apiKey: string,
  ): Promise<IClassificationResult> {
    const systemPrompt = `You are a medical triage assistant whose ONLY job is to understand the patient's condition and recommend exactly ONE best-fit medical specialist.

Your responsibilities:
- Analyze the patient's symptoms / description
- Decide how urgent it sounds (emergency, urgent, routine)
- Recommend exactly 1 specialist from the provided list ONLY (the single most appropriate one)
- Ask a FEW clarification questions ONLY when you truly need them to choose the right specialist

Available specialists:
${MEDICAL_SPECIALISTS.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Rules:
1) NEVER provide a medical diagnosis or treatment.
2) ALWAYS return exactly ONE item in the "specialists" array (if you are unsure, choose "General Physician").
3) If the description is unclear or missing key details, use the "summary" field to ask up to 3–4 SHORT, very focused clarification questions in plain text (for example: "To guide you better, please tell me: 1) How long has this been happening? 2) Where exactly is the pain?").
4) Do NOT ask more than 3–4 clarification questions in total.
5) Return VALID JSON ONLY that matches:
{
  "specialists": [
    { "name": string, "priority": "high" | "medium" | "low", "reason": string }
  ],
  "urgency": "emergency" | "urgent" | "routine",
  "summary": string
}

NEVER:
- Ask more than 4 questions
- Give a medical diagnosis
- Leave the patient without a next step


POST-RECOMMENDATION FLOW:
- After recommending a specialist, dont skip follow up questions about that specialist, always end with an open offer like:
  "Is there anything else you'd like to know, or do you have another concern?"

- If user asks follow-up about the SAME issue:
  * Answer briefly and reassure, stay within 2-3 sentences
  * Do not restart the Q&A flow

- If user mentions a NEW symptom or concern:
  * Acknowledge the previous recommendation is still valid
  * Start a fresh but short Q&A for the new concern (max 2-3 questions since some context exists)
  * Recommend a new specialist if different, or confirm the same one if relevant
`;

    const userPrompt = `Patient's problem description: "${description}"

Please analyze and recommend appropriate specialists.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.error?.message || `OpenAI API error: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log(
      '[AI] classifyWithOpenAI raw response:',
      JSON.stringify(data, null, 2),
    );

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = this.parseAIResponse(content);
    console.log('[AI] classifyWithOpenAI parsed result:', parsed);
    return this.validateAndNormalize(parsed);
  }

  private parseAIResponse(content: string): IClassificationResult {
    try {
      const trimmed = content.trim();
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : trimmed;
      return JSON.parse(jsonStr);
    } catch {
      throw new Error('Invalid JSON response from AI');
    }
  }

  private validateAndNormalize(parsed: any): IClassificationResult {
    if (!parsed?.specialists || !Array.isArray(parsed.specialists)) {
      throw new Error('Invalid AI response structure');
    }

    const normalizedSpecialists = parsed.specialists
      .slice(0, 1)
      .map((s: any) => {
        const matched = MEDICAL_SPECIALISTS.find(
          (spec) => spec.toLowerCase() === (s.name || '').toLowerCase(),
        );
        return {
          name: matched || s.name || 'General Physician',
          priority: ['high', 'medium', 'low'].includes(s.priority)
            ? s.priority
            : 'medium',
          reason: s.reason || 'Recommended based on symptoms',
        };
      });

    return {
      specialists: normalizedSpecialists,
      urgency: ['emergency', 'urgent', 'routine'].includes(parsed.urgency)
        ? parsed.urgency
        : 'routine',
      summary: parsed.summary || 'Medical consultation needed',
    };
  }

  private getFallbackClassification(
    description: string,
  ): IClassificationResult {
    const keywords = description.toLowerCase();

    const classifications: Array<{
      keywords: string[];
      specialist: string;
      reason: string;
    }> = [
      {
        keywords: [
          'heart',
          'chest pain',
          'cardiac',
          'palpitation',
          'blood pressure',
        ],
        specialist: 'Cardiologist',
        reason: 'Symptoms suggest cardiovascular concern',
      },
      {
        keywords: ['skin', 'rash', 'acne', 'itching', 'allergy', 'dermatitis'],
        specialist: 'Dermatologist',
        reason: 'Skin-related symptoms detected',
      },
      {
        keywords: ['bone', 'joint', 'fracture', 'back pain', 'knee', 'ortho'],
        specialist: 'Orthopedist',
        reason: 'Musculoskeletal symptoms identified',
      },
      {
        keywords: [
          'stomach',
          'digestion',
          'constipation',
          'diarrhea',
          'nausea',
          'bloating',
        ],
        specialist: 'Gastroenterologist',
        reason: 'Digestive system symptoms present',
      },
      {
        keywords: ['eye', 'vision', 'sight', 'blind', 'red eye'],
        specialist: 'Ophthalmologist',
        reason: 'Vision-related concerns',
      },
      {
        keywords: ['ear', 'nose', 'throat', 'hearing', 'sinus', 'tonsil'],
        specialist: 'ENT Specialist',
        reason: 'ENT symptoms identified',
      },
      {
        keywords: [
          'mental',
          'depression',
          'anxiety',
          'stress',
          'mood',
          'sleep',
        ],
        specialist: 'Psychiatrist',
        reason: 'Mental health symptoms detected',
      },
      {
        keywords: ['child', 'baby', 'infant', 'pediatric', 'kids'],
        specialist: 'Pediatrician',
        reason: 'Pediatric care needed',
      },
      {
        keywords: ['headache', 'migraine', 'seizure', 'numbness', 'stroke'],
        specialist: 'Neurologist',
        reason: 'Neurological symptoms detected',
      },
      {
        keywords: ['breathing', 'cough', 'asthma', 'lung'],
        specialist: 'Pulmonologist',
        reason: 'Respiratory symptoms identified',
      },
      {
        keywords: ['tooth', 'dental', 'gum', 'cavity'],
        specialist: 'Dentist',
        reason: 'Dental concerns detected',
      },
    ];

    for (const c of classifications) {
      if (c.keywords.some((k) => keywords.includes(k))) {
        return {
          specialists: [
            { name: c.specialist, priority: 'high' as const, reason: c.reason },
          ],
          urgency: 'routine',
          summary: 'Based on symptom analysis',
        };
      }
    }

    return {
      specialists: [
        {
          name: 'General Physician',
          priority: 'high',
          reason: 'Initial consultation recommended',
        },
      ],
      urgency: 'routine',
      summary: 'General medical consultation needed',
    };
  }

  /**
   * [Main function] : Chat endpoint that handles conversational AI with patient information extraction
   * and doctor recommendations
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async chat(dto: ChatRequestDto, _userId: string): Promise<ChatResponseDto> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    // Build conversation history
    const conversationHistory: ChatMessageDto[] = dto.conversationHistory || [];
    conversationHistory.push({ role: 'user', content: dto.message });

    // Determine if we should search for doctors (after gathering enough info)
    const shouldSearchDoctors = this.shouldSearchDoctors(conversationHistory);

    let aiResponse: string;
    let extractedInfo: any = {};
    let doctorRecommendations: DoctorRecommendationDto[] = [];

    if (apiKey) {
      try {
        const result = await this.chatWithOpenAI(
          conversationHistory,
          apiKey,
          shouldSearchDoctors,
        );
        aiResponse = result.response;
        extractedInfo = result.extractedInfo || {};
      } catch (error) {
        console.warn(
          '[AI] OpenAI chat failed, using fallback:',
          (error as Error)?.message,
        );
        aiResponse = this.getFallbackChatResponse(
          dto.message,
          conversationHistory,
        );
      }
    } else {
      aiResponse = this.getFallbackChatResponse(
        dto.message,
        conversationHistory,
      );
    }

    // If we have enough information, determine the right specialist(s) to search for
    if (
      shouldSearchDoctors &&
      (!extractedInfo.specialists || extractedInfo.specialists.length === 0)
    ) {
      // Use the full user conversation so far (all user messages) for better classification
      const fullUserDescription = conversationHistory
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join(' ');

      const classification = await this.classifySymptoms({
        description: fullUserDescription.trim() || dto.message,
      });

      extractedInfo.specialists = classification.specialists.map((s) => s.name);
      extractedInfo.urgency = classification.urgency;
      extractedInfo.summary = classification.summary;
    }

    if (shouldSearchDoctors && extractedInfo.specialists?.length > 0) {
      try {
        const doctors = await this.searchDoctors(extractedInfo);
        doctorRecommendations = this.formatDoctorRecommendations(
          doctors,
          extractedInfo,
        );

        // Enhance AI response with doctor recommendations
        if (doctorRecommendations.length > 0) {
          aiResponse += `\n\nI found ${doctorRecommendations.length} doctor${doctorRecommendations.length > 1 ? 's' : ''} that match your needs. Here are my recommendations:`;
        } else {
          aiResponse +=
            "\n\nI couldn't find doctors matching your specific criteria, but I can help you search with different filters.";
        }
      } catch (error) {
        console.error('[AI] Doctor search failed:', (error as Error)?.message);
      }
    }

    // Add assistant response to conversation history
    conversationHistory.push({ role: 'assistant', content: aiResponse });

    // Persist this chat turn to Firestore (best-effort; never break chat)
    await this.saveChatHistoryFirebase({
      userId: _userId,
      userMessage: dto.message,
      assistantMessage: aiResponse,
      extractedInfo,
      doctorRecommendations,
    });

    return {
      response: aiResponse,
      extractedInfo,
      doctorRecommendations,
      conversationHistory,
      searchedDoctors: shouldSearchDoctors && doctorRecommendations.length > 0,
    };
  }

  /**
   * Save chat history to the firebase database
   */
  private async saveChatHistoryFirebase(params: {
    userId?: string;
    userMessage: string;
    assistantMessage: string;
    extractedInfo: any;
    doctorRecommendations: DoctorRecommendationDto[];
  }): Promise<void> {
    try {
      const userId = params.userId?.trim();
      if (!userId) return;

      const firestore = this.firebaseService.getFireStore();

      // One active session per user for now (simple + scalable via subcollection).
      // You can extend later by adding a sessionId to ChatRequestDto.
      const sessionRef = firestore.collection('chatSessions').doc(userId);
      const messagesRef = sessionRef.collection('messages');

      const now = admin.firestore.FieldValue.serverTimestamp();

      // Avoid overwriting createdAt on every message
      await firestore.runTransaction(async (tx) => {
        const snap = await tx.get(sessionRef);
        if (!snap.exists) {
          tx.set(sessionRef, {
            userId,
            createdAt: now,
            updatedAt: now,
            lastMessage: params.userMessage,
            lastAssistantMessage: params.assistantMessage,
          });
        } else {
          tx.set(
            sessionRef,
            {
              userId,
              updatedAt: now,
              lastMessage: params.userMessage,
              lastAssistantMessage: params.assistantMessage,
            },
            { merge: true },
          );
        }
      });

      const meta = {
        extractedInfo: params.extractedInfo ?? null,
        doctorRecommendations: params.doctorRecommendations ?? [],
      };

      await messagesRef.add({
        role: 'user',
        content: params.userMessage,
        createdAt: now,
      });

      await messagesRef.add({
        role: 'assistant',
        content: params.assistantMessage,
        meta,
        createdAt: now,
      });
    } catch (error) {
      console.warn(
        '[AI] Failed to persist chat turn:',
        (error as Error)?.message,
      );
    }
  }

  /**
   * Determines if we have enough information to recommend a specialist
   * and start searching for doctors.
   *
   * Heuristic:
   * - At least 2 user messages (initial complaint + some follow‑up detail)
   * - At least one user message contains symptom / health‑problem keywords
   */
  private shouldSearchDoctors(conversationHistory: ChatMessageDto[]): boolean {
    const userMessages = conversationHistory
      .filter((m) => m.role === 'user')
      .map((m) => m.content.toLowerCase());

    const emergencyKeywords = [
      'chest pain',
      "can't breathe",
      'severe bleeding',
      'loss of consciousness',
      'unconscious',
      'stroke',
      'heart attack',
      'emergency',
    ];
    const hasEmergencySignals = userMessages.some((msg) =>
      emergencyKeywords.some((k) => msg.includes(k)),
    );

    const hasSymptoms = userMessages.some((msg) => {
      const symptomKeywords = [
        'pain',
        'ache',
        'hurt',
        'symptom',
        'problem',
        'issue',
        'concern',
        'feeling',
        'unwell',
        'sick',
        'ill',
        'headache',
        'fever',
        'cough',
        'nausea',
        'dizziness',
        'rash',
        'bleeding',
        'infection',
      ];
      return symptomKeywords.some((keyword) => msg.includes(keyword));
    });

    // For non-emergency: wait for at least 2 user messages (basic follow-up done)
    // For emergency: recommend immediately if symptoms are present
    if (!hasSymptoms) return false;
    if (hasEmergencySignals) return true;
    return userMessages.length >= 2;
  }

  /**
   * Chat with OpenAI GPT-4o-mini for natural conversation
   */
  private async chatWithOpenAI(
    conversationHistory: ChatMessageDto[],
    apiKey: string,
    shouldSearchDoctors: boolean,
  ): Promise<{ response: string; extractedInfo?: any }> {
    const systemPrompt = `You are a friendly and empathetic AI healthcare assistant. Your role is to:
1. Have natural, caring conversations with patients about their health concerns
2. Ask 3-4 normal and follow-up questions to understand their symptoms better but not more than that.
3. Extract key information: symptoms, urgency level.
4. Be warm, professional, and reassuring
5. If the patient has described symptoms, acknowledge them and ask if they'd like to find a doctor
6. If no specialist found means suggest general doctor , even its not means tell that no doctors found like that.
7.Should only one doctor be recommended at a time.

${shouldSearchDoctors ? 'IMPORTANT: The patient has described symptoms. After responding naturally, you should indicate that you can help them find a suitable doctor.' : ''}

Keep responses concise (2-3 sentences max) and conversational. Don't provide medical diagnoses, only help guide them to appropriate care.`;

    // Convert conversation history to OpenAI format
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(0, -1).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: conversationHistory[conversationHistory.length - 1].content,
      },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.error?.message || `OpenAI API error: ${response.status}`,
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Try to extract structured information
    const extractedInfo = this.extractPatientInfo(conversationHistory);

    console.log('Response:', response, 'ExtractInfo:', extractedInfo);

    return {
      response: content.trim(),
      extractedInfo,
    };
  }

  /**
   * Extract patient information from conversation history
   */
  private extractPatientInfo(conversationHistory: ChatMessageDto[]): any {
    const allText = conversationHistory
      .filter((m) => m.role === 'user')
      .map((m) => m.content.toLowerCase())
      .join(' ');

    const info: any = {};

    // Extract urgency indicators
    const emergencyKeywords = [
      'emergency',
      'severe',
      'critical',
      'urgent',
      'immediate',
      'chest pain',
      "can't breathe",
    ];
    const urgentKeywords = ['urgent', 'soon', 'asap', 'quickly'];

    if (emergencyKeywords.some((k) => allText.includes(k))) {
      info.urgency = 'emergency';
    } else if (urgentKeywords.some((k) => allText.includes(k))) {
      info.urgency = 'urgent';
    } else {
      info.urgency = 'routine';
    }

    // Extract location preferences
    const locationMatch = allText.match(
      /(?:in|near|at|location|city|area)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    );
    if (locationMatch) {
      info.location = locationMatch[1];
    }

    // Extract gender preferences
    if (allText.includes('male doctor') || allText.includes('male physician')) {
      info.gender = 'male';
    } else if (
      allText.includes('female doctor') ||
      allText.includes('female physician')
    ) {
      info.gender = 'female';
    }

    return info;
  }

  /**
   * Search doctors based on extracted information
   */
  private async searchDoctors(extractedInfo: any): Promise<any[]> {
    const filters: any = {
      limit: 5,
    };

    // Add expertise filter
    if (extractedInfo.specialists?.length > 0) {
      filters.expertise = extractedInfo.specialists.join(',');
    }

    return await this.doctorService.getDoctors(filters);
  }

  /**
   * Format doctors for recommendation display
   */
  private formatDoctorRecommendations(
    doctors: any[],
    extractedInfo: any,
  ): DoctorRecommendationDto[] {
    return doctors.map((doctor) => {
      const specialization = doctor.expertiseList?.[0] || 'General Physician';
      const location =
        doctor.location?.city ||
        doctor.location?.address ||
        'Location not specified';

      return {
        doctorId: doctor.uid || doctor.id,
        name: doctor.display_name || doctor.user_name || 'Dr. Unknown',
        specialization,
        rating: doctor.star_rating || 0,
        location,
        reason: `Matches your need for ${specialization}${extractedInfo.location ? ` in ${extractedInfo.location}` : ''}`,
      };
    });
  }

  /**
   * Fallback chat response when OpenAI is not available
   */
  private getFallbackChatResponse(
    message: string,
    conversationHistory: ChatMessageDto[],
  ): string {
    const lowerMessage = message.toLowerCase();

    // Greeting responses
    if (
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('hey')
    ) {
      return "Hello! I'm here to help you with your health concerns. How are you feeling today?";
    }

    // Symptom acknowledgment
    if (
      lowerMessage.includes('pain') ||
      lowerMessage.includes('ache') ||
      lowerMessage.includes('hurt')
    ) {
      return "I understand you're experiencing some discomfort. Can you tell me more about where the pain is located and how long you've been experiencing it?";
    }

    // Doctor search request
    if (
      lowerMessage.includes('doctor') ||
      lowerMessage.includes('find') ||
      lowerMessage.includes('search')
    ) {
      return 'I can help you find a suitable doctor. Can you describe your symptoms or health concern?';
    }

    // Default response
    if (conversationHistory.length <= 2) {
      return 'Thank you for sharing. Can you tell me more about your symptoms or health concern? This will help me find the right doctor for you.';
    }

    return "I understand. Based on what you've told me, I can help you find a doctor. Would you like me to search for doctors now?";
  }
}
