# AI Symptom Classification - Setup Guide

## Overview

The `/api/ai/classify-symptoms` endpoint analyzes patient symptoms and recommends appropriate medical specialists. It uses **OpenAI GPT-4o-mini** when configured, with a keyword-based fallback when the API key is not set.

## Backend Implementation

### Files Created

| File | Purpose |
|------|---------|
| `src/ai/ai.module.ts` | NestJS module registration |
| `src/ai/ai.controller.ts` | POST `/ai/classify-symptoms` route |
| `src/ai/ai.service.ts` | OpenAI integration + fallback logic |
| `src/ai/dto/classify-symptoms.dto.ts` | Request validation |

### Configuration

**Optional - OpenAI API Key**

Add to your `.env` file:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

- **If set:** Uses GPT-4o-mini for classification (higher accuracy)
- **If not set:** Uses keyword-based fallback (works offline, no cost)

### API Contract

**Request:**
```http
POST /api/ai/classify-symptoms
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "description": "I have severe headache and fever for 2 days"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "specialists": [
      {
        "name": "General Physician",
        "priority": "high",
        "reason": "Fever and headache suggest general consultation"
      }
    ],
    "urgency": "routine",
    "summary": "General medical consultation needed"
  },
  "message": "Classification successful"
}
```

### Authentication

- Requires Firebase Bearer token (same as doctors/booking endpoints)
- Allowed roles: `customer`, `admin`

## Frontend (doctor-app)

The Ask AI feature is integrated in the Explore screen. When the backend API fails or is unreachable, the app uses client-side fallback classification from `aiClassificationService.js`.
