import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClassifySymptomsDto } from './dto/classify-symptoms.dto';
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
  constructor(private readonly configService: ConfigService) {}

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
}
