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
import FormData = require('form-data');

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

  private async classifyWithOpenAI(
    description: string,
    apiKey: string,
  ): Promise<IClassificationResult> {
    const systemPrompt = `You are a medical triage assistant. Your role is to analyze patient symptoms and recommend appropriate medical specialists.

Available specialists (use these exact names):
${MEDICAL_SPECIALISTS.map((s, i) => `${i + 1}. ${s}`).join('\n')}

INSTRUCTIONS:
1. Analyze the patient's symptoms/problem description
2. Identify the most relevant medical specialists (1-3 maximum)
3. Provide a brief explanation for each recommendation
4. Consider severity and urgency indicators
5. If symptoms are vague, recommend General Physician

RESPONSE FORMAT (valid JSON only):
{
  "specialists": [
    {
      "name": "Exact Specialist Name from list",
      "priority": "high|medium|low",
      "reason": "Brief explanation why this specialist is recommended"
    }
  ],
  "urgency": "emergency|urgent|routine",
  "summary": "Brief summary of the patient's concern"
}

IMPORTANT:
- Only recommend specialists from the available list using exact names
- Be conservative and prioritize patient safety
- For emergencies (chest pain, severe bleeding, loss of consciousness), mark urgency as "emergency"
- Return valid JSON only, no markdown or additional text`;

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
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = this.parseAIResponse(content);
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
      .slice(0, 3)
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
   * Chat endpoint that handles conversational AI with patient information extraction
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

    // If we have enough information, search for doctors
    if (
      shouldSearchDoctors &&
      (!extractedInfo.specialists || extractedInfo.specialists.length === 0)
    ) {
      // Extract specialists from conversation if not already extracted
      const classification = await this.classifySymptoms({
        description: dto.message,
      });
      extractedInfo.specialists = classification.specialists.map((s) => s.name);
      extractedInfo.urgency = classification.urgency;
      extractedInfo.summary = classification.summary;
    }

    if (shouldSearchDoctors && extractedInfo.specialists?.length > 0) {
      try {
        const doctors = await this.searchDoctors(
          extractedInfo,
          dto.preferences,
        );
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

    return {
      response: aiResponse,
      extractedInfo,
      doctorRecommendations,
      conversationHistory,
      searchedDoctors: shouldSearchDoctors && doctorRecommendations.length > 0,
    };
  }

  /**
   * Determines if we have enough information to search for doctors
   */
  private shouldSearchDoctors(conversationHistory: ChatMessageDto[]): boolean {
    if (conversationHistory.length < 2) return false; // Need at least user message + assistant response

    // Check if user has mentioned symptoms or health concerns
    const userMessages = conversationHistory
      .filter((m) => m.role === 'user')
      .map((m) => m.content.toLowerCase());

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

    return hasSymptoms;
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
2. Ask follow-up questions to understand their symptoms better
3. Extract key information: symptoms, urgency level, preferred specialist types, location preferences, gender preferences
4. Be warm, professional, and reassuring
5. If the patient has described symptoms, acknowledge them and ask if they'd like to find a doctor

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
  private async searchDoctors(
    extractedInfo: any,
    preferences?: any,
  ): Promise<any[]> {
    const filters: any = {
      limit: 5,
    };

    // Add expertise filter
    if (extractedInfo.specialists?.length > 0) {
      filters.expertise = extractedInfo.specialists.join(',');
    }

    // Add preferences
    if (preferences?.gender) {
      filters.gender = preferences.gender;
    } else if (extractedInfo.gender) {
      filters.gender = extractedInfo.gender;
    }

    if (preferences?.location) {
      filters.location = preferences.location;
    } else if (extractedInfo.location) {
      filters.location = extractedInfo.location;
    }

    if (preferences?.minRating) {
      filters.minRating = preferences.minRating;
    } else {
      filters.minRating = 3.5; // Default minimum rating
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
