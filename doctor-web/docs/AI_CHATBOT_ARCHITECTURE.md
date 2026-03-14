# AI Chatbot System - Architecture & Design Decisions

## System Architecture Overview

As a system and AI architect, I've designed a **conversational AI healthcare assistant** that intelligently guides patients through symptom description and automatically matches them with suitable doctors from the database.

## Core Design Principles

### 1. **Conversational Intelligence**
- **Natural Language Understanding**: Uses OpenAI GPT-4o-mini for natural, empathetic conversations
- **Context Awareness**: Maintains conversation history for multi-turn dialogues
- **Progressive Information Gathering**: Asks follow-up questions to gather sufficient information

### 2. **Intelligent Doctor Matching**
- **Information Extraction**: Automatically extracts symptoms, urgency, preferences from conversation
- **Dynamic Filtering**: Applies extracted criteria to doctor search
- **Relevance Ranking**: Returns doctors matched to patient needs with explanations

### 3. **User Experience**
- **Seamless Integration**: Chat interface integrated into existing mobile app
- **Visual Recommendations**: Doctor cards displayed directly in chat
- **Actionable Results**: One-tap navigation to doctor profiles

## Architecture Layers

### Layer 1: Presentation (Frontend)
**Technology**: React Native with Redux Toolkit Query

**Components**:
- `ChatScreen`: Main chat interface
- Message bubbles (user/assistant)
- Doctor recommendation cards
- Loading states and error handling

**Key Features**:
- Real-time message display
- Conversation state management
- Doctor card navigation
- Responsive UI with keyboard handling

### Layer 2: API Layer (Backend)
**Technology**: NestJS with TypeScript

**Endpoints**:
- `POST /api/ai/chat`: Main chat endpoint

**Responsibilities**:
- Request validation
- Authentication/authorization
- Error handling
- Response formatting

### Layer 3: Business Logic (AI Service)
**Technology**: NestJS Service Layer

**Core Functions**:
1. **Conversation Management**
   - Maintains conversation history
   - Determines when to search doctors
   - Manages context window

2. **AI Integration**
   - OpenAI GPT-4o-mini for natural responses
   - Fallback to keyword-based responses
   - Information extraction from conversations

3. **Doctor Matching**
   - Extracts patient criteria
   - Applies filters to doctor search
   - Formats recommendations

### Layer 4: Data Layer
**Technology**: Firebase Firestore

**Collections**:
- `profiles`: Doctor and patient profiles
- `services`: Doctor services
- `availability_slots`: Doctor availability

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                         │
│  Patient types: "I have a severe headache"                 │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (ChatScreen.js)                       │
│  - Captures user message                                     │
│  - Maintains conversation state                             │
│  - Calls API with conversation history                      │
└───────────────────────┬───────────────────────────────────┘
                        │ HTTP POST /api/ai/chat
                        │ { message, conversationHistory }
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           BACKEND API (ai.controller.ts)                   │
│  - Validates request                                         │
│  - Authenticates user                                        │
│  - Delegates to AI Service                                   │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            AI SERVICE (ai.service.ts)                       │
│                                                              │
│  Step 1: Determine if doctor search needed                  │
│    └─> shouldSearchDoctors()                                │
│                                                              │
│  Step 2: Generate AI response                               │
│    └─> chatWithOpenAI()                                     │
│        └─> OpenAI GPT-4o-mini API                           │
│                                                              │
│  Step 3: Extract patient information                        │
│    └─> extractPatientInfo()                                 │
│        - Symptoms                                            │
│        - Urgency level                                       │
│        - Location preferences                                │
│        - Gender preferences                                  │
│                                                              │
│  Step 4: Search doctors (if needed)                          │
│    └─> searchDoctors()                                       │
│        └─> DoctorService.getDoctors()                      │
│            └─> Firebase Firestore Query                      │
│                                                              │
│  Step 5: Format recommendations                              │
│    └─> formatDoctorRecommendations()                        │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              RESPONSE TO FRONTEND                            │
│  {                                                           │
│    response: "AI generated response",                       │
│    extractedInfo: { symptoms, urgency, specialists },       │
│    doctorRecommendations: [ ... ],                          │
│    conversationHistory: [ ... ]                             │
│  }                                                           │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          FRONTEND DISPLAY                                   │
│  - Shows AI response in chat bubble                          │
│  - Displays doctor recommendation cards                     │
│  - Updates conversation history                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. **Why OpenAI GPT-4o-mini?**

**Decision**: Use GPT-4o-mini for conversational AI

**Rationale**:
- **Cost-Effective**: ~10x cheaper than GPT-4 while maintaining quality
- **Fast Response Times**: Lower latency for better UX
- **Sufficient Capability**: Adequate for healthcare triage conversations
- **Fallback Support**: System works without API key (keyword-based)

**Trade-offs**:
- Less sophisticated than GPT-4, but sufficient for this use case
- Requires API key, but has fallback mechanism

### 2. **Conversation History Management**

**Decision**: Maintain conversation history in frontend and send to backend

**Rationale**:
- **Context Preservation**: Enables multi-turn conversations
- **Information Accumulation**: Gradually builds patient profile
- **Better Matching**: More context = better doctor recommendations

**Implementation**:
- Frontend maintains UI state (`messages`)
- Frontend maintains API context (`conversationHistory`)
- Backend receives history and updates it

### 3. **Doctor Search Trigger Logic**

**Decision**: Search doctors only when sufficient information is available

**Rationale**:
- **Efficiency**: Avoids unnecessary database queries
- **Better Results**: More information = better matches
- **User Experience**: Prevents premature recommendations

**Trigger Conditions**:
- At least 2 messages exchanged
- User has mentioned symptoms (keyword detection)
- Sufficient information extracted

### 4. **Information Extraction Strategy**

**Decision**: Hybrid approach - AI extraction + keyword fallback

**Rationale**:
- **Robustness**: Works even if OpenAI API fails
- **Accuracy**: AI extraction is more accurate
- **Reliability**: Keyword fallback ensures system always works

**Extraction Methods**:
1. **AI-Based**: Uses GPT-4o-mini to extract structured info
2. **Keyword-Based**: Fallback using pattern matching
3. **Classification**: Uses existing symptom classification service

### 5. **Doctor Recommendation Format**

**Decision**: Return formatted recommendations with reasons

**Rationale**:
- **Transparency**: Users understand why doctors are recommended
- **Trust**: Builds confidence in recommendations
- **Actionability**: Clear next steps (view profile)

**Format Includes**:
- Doctor basic info (name, specialization, rating, location)
- Reason for recommendation
- Quick action (view profile button)

## Scalability Considerations

### Current Limitations

1. **Conversation History**: Not persisted (lost on app restart)
2. **Rate Limiting**: No rate limiting implemented
3. **Caching**: No caching of doctor search results
4. **Streaming**: Responses are not streamed

### Scalability Solutions

1. **Conversation Persistence**
   - Store conversations in Firestore
   - Link to user profiles
   - Enable conversation history

2. **Rate Limiting**
   - Implement per-user rate limits
   - Prevent abuse
   - Fair usage policies

3. **Caching Strategy**
   - Cache doctor search results per conversation
   - Cache OpenAI responses for common queries
   - Reduce API costs

4. **Response Streaming**
   - Stream OpenAI responses
   - Better perceived performance
   - More engaging UX

## Security Architecture

### Authentication & Authorization

- **Firebase Authentication**: All requests require valid token
- **Role-Based Access**: Only `CUSTOMER` and `ADMIN` roles
- **Token Validation**: Middleware validates tokens

### Data Privacy

- **No Persistent Storage**: Conversations not stored (can be enhanced)
- **Secure Transmission**: HTTPS only
- **Input Validation**: All inputs validated via DTOs

### API Security

- **Rate Limiting**: Should be implemented
- **Input Sanitization**: DTOs validate inputs
- **Error Handling**: No sensitive data in error messages

## Performance Optimization

### Backend Optimizations

1. **Efficient Queries**: Doctor search uses indexed fields
2. **Lazy Loading**: Only search when needed
3. **Response Caching**: Can cache common responses

### Frontend Optimizations

1. **Message Rendering**: FlatList for efficient rendering
2. **Lazy Loading**: Load doctor cards on demand
3. **State Management**: Redux for predictable state

### API Optimizations

1. **Token Limits**: Limit conversation history length
2. **Batch Operations**: Batch doctor queries when possible
3. **Connection Pooling**: Reuse database connections

## Monitoring & Analytics

### Key Metrics to Track

1. **Conversation Metrics**
   - Average conversation length
   - Messages per conversation
   - Completion rate

2. **AI Performance**
   - Response time
   - API success rate
   - Fallback usage rate

3. **Doctor Matching**
   - Match accuracy
   - User click-through rate
   - Appointment booking rate

4. **User Engagement**
   - Daily active users
   - Conversations per user
   - Return rate

## Future Architecture Enhancements

### Phase 2: Enhanced Intelligence

1. **Medical History Integration**
   - Link to patient medical records
   - Personalized recommendations
   - Risk assessment

2. **Multi-modal Input**
   - Image upload for symptoms
   - Voice input (already have Whisper)
   - Video consultation prep

3. **Proactive Suggestions**
   - Location-based suggestions
   - Time-based availability
   - Preventive care reminders

### Phase 3: Advanced Features

1. **Appointment Booking**
   - Direct booking from chat
   - Calendar integration
   - Reminder system

2. **Follow-up Care**
   - Post-appointment check-ins
   - Medication reminders
   - Progress tracking

3. **Analytics Dashboard**
   - Conversation insights
   - Doctor performance metrics
   - System health monitoring

## Conclusion

This architecture provides a **scalable, intelligent, and user-friendly** chatbot system that:

✅ Engages patients naturally  
✅ Extracts relevant information intelligently  
✅ Matches patients with suitable doctors  
✅ Provides actionable recommendations  
✅ Scales with growing user base  
✅ Maintains security and privacy  

The system is designed to evolve with additional features while maintaining core functionality and performance.

---

**Architect**: AI System Architect  
**Date**: February 2026  
**Version**: 1.0.0
