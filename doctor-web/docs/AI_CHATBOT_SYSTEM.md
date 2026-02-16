# AI Chatbot System - Complete Documentation

## Overview

The AI Chatbot System is an intelligent healthcare assistant that engages in natural conversations with patients, extracts relevant health information, and recommends suitable doctors from the database. The system uses OpenAI GPT-4o-mini for natural language understanding and conversation, combined with intelligent doctor matching based on extracted patient information.

## Architecture

### System Components

```
┌─────────────────┐
│   Frontend      │
│  (React Native) │
│   ChatScreen    │
└────────┬────────┘
         │ HTTP POST /api/ai/chat
         │
┌────────▼─────────────────────────┐
│      Backend (NestJS)            │
│                                  │
│  ┌──────────────────────────┐   │
│  │   AI Controller          │   │
│  │   POST /ai/chat          │   │
│  └──────────┬───────────────┘   │
│             │                    │
│  ┌──────────▼───────────────┐   │
│  │   AI Service              │   │
│  │   - Conversation Mgmt     │   │
│  │   - Info Extraction       │   │
│  │   - OpenAI Integration    │   │
│  └──────────┬───────────────┘   │
│             │                    │
│  ┌──────────▼───────────────┐   │
│  │   Doctor Service          │   │
│  │   - Search Doctors        │   │
│  │   - Apply Filters         │   │
│  └───────────────────────────┘   │
└──────────────────────────────────┘
         │
         │ OpenAI API
         │ Firebase Firestore
         ▼
```

### Data Flow

1. **User Input**: Patient sends a message through the chat interface
2. **Conversation Context**: Frontend sends message + conversation history to backend
3. **AI Processing**: Backend uses OpenAI to generate natural response and extract patient info
4. **Doctor Search**: If enough information is gathered, system searches doctors using extracted criteria
5. **Response**: Backend returns AI response + doctor recommendations
6. **UI Update**: Frontend displays response and doctor cards

## Backend Implementation

### API Endpoint

**POST** `/api/ai/chat`

**Authentication**: Required (Firebase Bearer token)

**Request Body**:
```typescript
{
  message: string;                    // User's message
  conversationHistory?: Array<{       // Optional conversation context
    role: 'user' | 'assistant';
    content: string;
  }>;
  preferences?: {                     // Optional user preferences
    gender?: string;
    location?: string;
    minRating?: number;
  };
}
```

**Response**:
```typescript
{
  statusCode: 200,
  data: {
    response: string;                 // AI assistant's response
    extractedInfo?: {                 // Extracted patient information
      symptoms?: string[];
      urgency?: 'emergency' | 'urgent' | 'routine';
      specialists?: string[];
      summary?: string;
      location?: string;
      gender?: string;
    };
    doctorRecommendations?: Array<{   // Recommended doctors
      doctorId: string;
      name: string;
      specialization: string;
      rating: number;
      location: string;
      reason: string;
    }>;
    conversationHistory: Array<{      // Updated conversation history
      role: 'user' | 'assistant';
      content: string;
    }>;
    searchedDoctors: boolean;         // Whether doctor search was performed
  },
  message: string;
}
```

### Key Features

#### 1. Conversation Management
- Maintains conversation history for context
- Tracks user messages and assistant responses
- Enables multi-turn conversations

#### 2. Intelligent Information Extraction
The system extracts:
- **Symptoms**: From user's description
- **Urgency Level**: Based on keywords (emergency, urgent, routine)
- **Specialist Types**: Using symptom classification
- **Location Preferences**: From user messages
- **Gender Preferences**: If mentioned

#### 3. Doctor Search Trigger
The system searches for doctors when:
- User has described symptoms (detected via keyword matching)
- At least 2 messages have been exchanged
- Sufficient information is available

#### 4. Doctor Matching Algorithm
1. Extract specialist types from conversation
2. Apply filters:
   - Expertise/specialization
   - Gender preference (if specified)
   - Location preference (if specified)
   - Minimum rating (default: 3.5)
3. Return top 5 matching doctors
4. Format recommendations with relevance reasons

### AI Service Methods

#### `chat(dto: ChatRequestDto, userId: string): Promise<ChatResponseDto>`
Main chat handler that:
- Processes conversation history
- Determines if doctor search is needed
- Calls OpenAI for natural responses
- Searches and formats doctor recommendations

#### `shouldSearchDoctors(conversationHistory: ChatMessageDto[]): boolean`
Determines if enough information is available to search doctors.

#### `chatWithOpenAI(...)`
Handles OpenAI API calls for natural conversation generation.

#### `extractPatientInfo(conversationHistory: ChatMessageDto[]): any`
Extracts structured patient information from conversation.

#### `searchDoctors(extractedInfo: any, preferences?: any): Promise<any[]>`
Searches doctors using extracted information and preferences.

#### `formatDoctorRecommendations(doctors: any[], extractedInfo: any): DoctorRecommendationDto[]`
Formats doctor data for display in chat UI.

## Frontend Implementation

### ChatScreen Component

**Location**: `doctor-app/screens/ChatScreen.js`

**Key Features**:
- Real-time chat interface
- Conversation history management
- Doctor recommendation cards
- Loading states
- Error handling

### State Management

- **messages**: Array of chat messages (UI state)
- **conversationHistory**: Array for API context
- **isLoading**: Loading state for API calls

### Redux Integration

**Slice**: `doctor-app/store/slices/ai.slice.js`

**Mutation**: `useChatMutation()`

```javascript
const [chatMutation] = useChatMutation();

const response = await chatMutation({
  message: userMessage,
  conversationHistory: history,
  preferences: userPreferences,
}).unwrap();
```

### Doctor Recommendation Cards

Cards display:
- Doctor name and photo
- Specialization
- Star rating
- Location
- Reason for recommendation
- "View Profile" button (navigates to DoctorProfile screen)

## Usage Examples

### Example 1: Initial Conversation

**User**: "I have a severe headache"

**AI Response**: "I understand you're experiencing a severe headache. Can you tell me how long you've been experiencing it, and is it accompanied by any other symptoms?"

**System Action**: 
- Extracts: urgency="urgent", symptoms=["headache"]
- Does NOT search doctors yet (needs more info)

### Example 2: After Gathering Info

**User**: "It's been 2 days, and I also have a fever"

**AI Response**: "Thank you for that information. Based on your symptoms of headache and fever, I recommend consulting with a General Physician. Let me find some doctors for you."

**System Action**:
- Extracts: specialists=["General Physician"], urgency="routine"
- Searches doctors with expertise="General Physician"
- Returns 5 doctor recommendations

### Example 3: With Preferences

**User**: "I prefer a female doctor in New York"

**System Action**:
- Extracts: gender="female", location="New York"
- Applies filters: gender="female", location="New York"
- Returns matching doctors

## Configuration

### Environment Variables

**Required**:
- `OPENAI_API_KEY`: OpenAI API key for GPT-4o-mini (optional but recommended)

**Note**: If `OPENAI_API_KEY` is not set, the system uses fallback keyword-based responses.

### Module Dependencies

**Backend**:
- `AiModule` imports `DoctorModule` and `FirebaseModule`
- `DoctorModule` exports `DoctorService`

**Frontend**:
- Redux Toolkit Query for API calls
- React Navigation for screen navigation

## Error Handling

### Backend Errors
- OpenAI API failures fall back to keyword-based responses
- Doctor search errors are logged but don't break conversation
- Invalid requests return appropriate HTTP status codes

### Frontend Errors
- Network errors show user-friendly messages
- Loading states prevent duplicate requests
- Error messages displayed in chat bubbles

## Performance Considerations

### Optimization Strategies

1. **Conversation History**: Limited to recent messages (last 10-15) to reduce API payload
2. **Doctor Search**: Only triggered when sufficient information is available
3. **Caching**: Doctor search results can be cached per conversation session
4. **Rate Limiting**: Consider implementing rate limits for OpenAI API calls

### API Costs

- **OpenAI GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average conversation: ~500-1000 tokens per message
- Estimated cost: ~$0.001-0.002 per conversation turn

## Security Considerations

1. **Authentication**: All endpoints require Firebase authentication
2. **Authorization**: Only `CUSTOMER` and `ADMIN` roles can access chat
3. **Data Privacy**: Conversation history is not persisted (can be enhanced)
4. **Input Validation**: All inputs validated via DTOs
5. **Rate Limiting**: Should be implemented for production

## Future Enhancements

### Planned Features

1. **Conversation Persistence**: Store conversations in Firestore for history
2. **Multi-language Support**: Support for multiple languages
3. **Voice Input**: Integration with existing Whisper transcription
4. **Appointment Booking**: Direct booking from chat recommendations
5. **Follow-up Reminders**: Schedule follow-up conversations
6. **Medical History**: Link conversations to patient medical records
7. **Sentiment Analysis**: Detect patient urgency from tone
8. **Proactive Suggestions**: Suggest doctors based on time/location

### Technical Improvements

1. **Streaming Responses**: Stream AI responses for better UX
2. **Context Window Management**: Better handling of long conversations
3. **Multi-modal Input**: Support images/videos for symptom description
4. **Advanced Matching**: ML-based doctor-patient matching
5. **Analytics**: Track conversation patterns and success rates

## Testing

### Backend Testing

```typescript
// Example test cases
describe('AiService', () => {
  it('should extract patient info from conversation', async () => {
    // Test extraction logic
  });

  it('should search doctors when enough info is available', async () => {
    // Test doctor search trigger
  });

  it('should handle OpenAI API failures gracefully', async () => {
    // Test fallback behavior
  });
});
```

### Frontend Testing

```javascript
// Example test cases
describe('ChatScreen', () => {
  it('should send messages to backend', async () => {
    // Test API integration
  });

  it('should display doctor recommendations', () => {
    // Test UI rendering
  });

  it('should handle errors gracefully', () => {
    // Test error states
  });
});
```

## Troubleshooting

### Common Issues

1. **No doctor recommendations appearing**
   - Check if symptoms are mentioned in conversation
   - Verify doctor search filters
   - Check Firebase connection

2. **OpenAI API errors**
   - Verify API key is set correctly
   - Check API quota/limits
   - System falls back to keyword-based responses

3. **Conversation context lost**
   - Ensure conversationHistory is maintained in frontend state
   - Check API request payload

4. **Slow responses**
   - Check OpenAI API latency
   - Consider implementing response streaming
   - Optimize doctor search queries

## Related Documentation

- [AI Classification Setup](./AI_CLASSIFICATION_SETUP.md)
- [Voice-to-Text Transcription](./VOICE_TO_TEXT_TRANSCRIPTION.md)
- [Doctor Search API](../doctor-web/src/doctor/README.md)

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Check OpenAI API status
4. Verify Firebase connection

---

**Last Updated**: February 2026
**Version**: 1.0.0
