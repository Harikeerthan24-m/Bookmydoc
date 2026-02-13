/**
 * AI Classification Service
 * Handles medical symptom classification and specialist recommendation
 */

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

/**
 * Generates the system prompt for AI classification
 */
const getSystemPrompt = () => {
  return `You are a medical triage assistant. Your role is to analyze patient symptoms and recommend appropriate medical specialists.

Available specialists:
${MEDICAL_SPECIALISTS.map((s, i) => `${i + 1}. ${s}`).join('\n')}

INSTRUCTIONS:
1. Analyze the patient's symptoms/problem description
2. Identify the most relevant medical specialists (1-3 maximum)
3. Provide a brief explanation for each recommendation
4. Consider severity and urgency indicators
5. If symptoms are vague, recommend General Physician

RESPONSE FORMAT (JSON):
{
  "specialists": [
    {
      "name": "Specialist Name",
      "priority": "high|medium|low",
      "reason": "Brief explanation why this specialist is recommended"
    }
  ],
  "urgency": "emergency|urgent|routine",
  "summary": "Brief summary of the patient's concern"
}

IMPORTANT:
- Only recommend specialists from the available list
- Be conservative and prioritize patient safety
- For emergencies (chest pain, severe bleeding, loss of consciousness), mark urgency as "emergency"
- Return valid JSON only, no additional text`;
};

/**
 * Generates the user prompt based on patient's problem description
 */
const getUserPrompt = (problemDescription) => {
  return `Patient's problem description: "${problemDescription}"

Please analyze and recommend appropriate specialists.`;
};

/**
 * Validates and normalizes the AI response
 */
const validateAIResponse = (response) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid AI response format');
  }

  if (
    !Array.isArray(response.specialists) ||
    response.specialists.length === 0
  ) {
    throw new Error('No specialists recommended');
  }

  // Normalize specialist names to match available list
  const normalizedSpecialists = response.specialists.map((specialist) => {
    const matchedSpecialist = MEDICAL_SPECIALISTS.find(
      (s) => s.toLowerCase() === specialist.name.toLowerCase(),
    );

    return {
      name: matchedSpecialist || specialist.name,
      priority: specialist.priority || 'medium',
      reason: specialist.reason || 'Recommended based on symptoms',
    };
  });

  return {
    specialists: normalizedSpecialists,
    urgency: response.urgency || 'routine',
    summary: response.summary || 'Medical consultation needed',
  };
};

/**
 * Fallback classification when AI service is unavailable
 */
const getFallbackClassification = (problemDescription) => {
  const keywords = problemDescription.toLowerCase();

  // Simple keyword-based classification
  const classifications = [
    {
      keywords: ['heart', 'chest pain', 'cardiac', 'palpitation'],
      specialist: 'Cardiologist',
      reason: 'Symptoms suggest cardiovascular concern',
    },
    {
      keywords: ['skin', 'rash', 'acne', 'itching', 'allergy'],
      specialist: 'Dermatologist',
      reason: 'Skin-related symptoms detected',
    },
    {
      keywords: ['bone', 'joint', 'fracture', 'pain', 'back', 'knee'],
      specialist: 'Orthopedist',
      reason: 'Musculoskeletal symptoms identified',
    },
    {
      keywords: ['stomach', 'digestion', 'constipation', 'diarrhea', 'nausea'],
      specialist: 'Gastroenterologist',
      reason: 'Digestive system symptoms present',
    },
    {
      keywords: ['eye', 'vision', 'sight', 'blind'],
      specialist: 'Ophthalmologist',
      reason: 'Vision-related concerns',
    },
    {
      keywords: ['ear', 'nose', 'throat', 'hearing', 'sinus'],
      specialist: 'ENT Specialist',
      reason: 'ENT symptoms identified',
    },
    {
      keywords: ['mental', 'depression', 'anxiety', 'stress', 'mood'],
      specialist: 'Psychiatrist',
      reason: 'Mental health symptoms detected',
    },
    {
      keywords: ['child', 'baby', 'infant', 'pediatric'],
      specialist: 'Pediatrician',
      reason: 'Pediatric care needed',
    },
  ];

  for (const classification of classifications) {
    if (classification.keywords.some((keyword) => keywords.includes(keyword))) {
      return {
        specialists: [
          {
            name: classification.specialist,
            priority: 'high',
            reason: classification.reason,
          },
        ],
        urgency: 'routine',
        summary: 'Based on symptom analysis',
      };
    }
  }

  // Default to General Physician
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
};

/**
 * Main classification function
 */
export const classifySymptoms = async (problemDescription) => {
  if (!problemDescription || problemDescription.trim().length < 3) {
    throw new Error('Please provide a detailed description of your problem');
  }

  try {
    // This will be called via the API endpoint
    return {
      systemPrompt: getSystemPrompt(),
      userPrompt: getUserPrompt(problemDescription),
      fallback: getFallbackClassification(problemDescription),
    };
  } catch (error) {
    console.error('Classification error:', error);
    throw error;
  }
};

/**
 * Process AI response and return structured data
 */
export const processAIResponse = (aiResponse) => {
  try {
    // Parse if response is string
    const parsed =
      typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;

    return validateAIResponse(parsed);
  } catch (error) {
    console.error('Error processing AI response:', error);
    throw new Error('Failed to process AI response');
  }
};

export { MEDICAL_SPECIALISTS, getFallbackClassification };
