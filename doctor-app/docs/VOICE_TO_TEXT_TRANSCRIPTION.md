# Voice-to-Text Transcription with OpenAI Whisper

## Overview

This guide explains how to implement a complete voice-to-text transcription feature using OpenAI's Whisper API, including audio recording in React Native (Expo), backend transcription, and seamless UI integration. This pattern can be applied to any React Native + Node.js project.

---

## Architecture

```
User speaks → Record audio → Upload to backend → Whisper API → Transcribed text → Fill input
```

### Key Components

1. **Frontend (React Native/Expo)**
   - Audio recording using `expo-av`
   - File upload with `FormData`
   - UI feedback (recording indicator, loading states)
   - Redux Toolkit Query for API calls

2. **Backend (NestJS/Express)**
   - File upload handler (`multer`)
   - OpenAI Whisper API integration
   - Error handling and validation

3. **API Communication**
   - Multipart form data for audio file transfer
   - RESTful endpoint pattern

---

## Implementation Steps

### 1. Backend: Transcription Endpoint

#### A. Install Dependencies

```bash
npm install form-data
# If using NestJS:
npm install @nestjs/platform-express
npm install --save-dev @types/multer
```

#### B. Create Service

```typescript
// ai.service.ts (NestJS) or similar service file

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData = require('form-data');

@Injectable()
export class TranscriptionService {
  constructor(private readonly configService: ConfigService) {}

  async transcribeAudio(file: Express.Multer.File): Promise<{ text: string }> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new HttpException(
        'OpenAI API key not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!file || !file.buffer) {
      throw new HttpException('Audio file is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // Create FormData for Whisper API
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname || 'audio.m4a',
        contentType: file.mimetype || 'audio/m4a',
      });
      formData.append('model', 'whisper-1');

      // Call OpenAI Whisper API
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
      console.error('[Transcription] Failed:', (error as Error)?.message);
      throw new HttpException(
        (error as Error)?.message || 'Transcription failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

#### C. Create Controller/Route

```typescript
// NestJS Controller
import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/transcribe')
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    const result = await this.transcriptionService.transcribeAudio(file);
    return {
      statusCode: 200,
      data: result,
      message: 'Transcription successful',
    };
  }
}
```

**For Express.js:**

```javascript
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const result = await transcriptionService.transcribeAudio(req.file);
    res.json({
      statusCode: 200,
      data: result,
      message: 'Transcription successful',
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: error.message,
    });
  }
});
```

#### D. Environment Configuration

Add to your `.env`:

```bash
OPENAI_API_KEY=sk-proj-...your-key-here...
```

---

### 2. Frontend: Audio Recording (React Native/Expo)

#### A. Install Dependencies

```bash
npx expo install expo-av
```

#### B. Request Permissions

```javascript
import { Audio } from 'expo-av';

const requestMicrophonePermission = async () => {
  try {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      alert('Microphone permission is required');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};
```

#### C. Recording Logic

```javascript
import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const useVoiceRecording = (onTranscriptionComplete) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef(null);

  const startRecording = async () => {
    try {
      // Request permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      setIsRecording(false);

      if (!recordingRef.current) return;

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (!uri) {
        alert('No audio recorded');
        return;
      }

      // Send to backend
      setIsTranscribing(true);
      const transcribedText = await uploadAndTranscribe(uri);
      setIsTranscribing(false);

      if (transcribedText) {
        onTranscriptionComplete(transcribedText);
      }
    } catch (error) {
      setIsTranscribing(false);
      console.error('Transcription error:', error);
      alert('Voice transcription failed');
    }
  };

  const uploadAndTranscribe = async (uri) => {
    const formData = new FormData();
    formData.append('audio', {
      uri,
      type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/m4a',
      name: 'recording.m4a',
    });

    const response = await fetch('YOUR_API_URL/api/transcribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const result = await response.json();
    return result?.data?.text;
  };

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecordingAndTranscribe,
  };
};
```

#### D. UI Component

```javascript
import { TouchableOpacity, Text, View, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VoiceInputButton = ({ onTranscriptionComplete }) => {
  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecordingAndTranscribe,
  } = useVoiceRecording(onTranscriptionComplete);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handlePress = () => {
    if (isRecording) {
      stopRecordingAndTranscribe();
    } else {
      startRecording();
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isTranscribing}
        style={styles.micButton}
      >
        {isTranscribing ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic'}
              size={24}
              color={isRecording ? '#FF3B30' : '#007AFF'}
            />
          </Animated.View>
        )}
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>
            Listening... Tap stop when done
          </Text>
        </View>
      )}

      {isTranscribing && (
        <View style={styles.transcribingIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.transcribingText}>
            Converting speech to text...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
  },
  transcribingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 10,
  },
  transcribingText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
});
```

---

### 3. Redux Toolkit Query Integration (Optional but Recommended)

If using RTK Query:

```javascript
// api/transcriptionSlice.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

export const TranscriptionSlice = createApi({
  reducerPath: 'transcriptionApi',
  baseQuery: axiosBaseQuery({ baseUrl: '' }),
  endpoints: (build) => ({
    transcribeAudio: build.mutation({
      query: (formData) => ({
        url: '/api/transcribe',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        data: formData,
      }),
      transformResponse: (response) => response?.data,
    }),
  }),
});

export const { useTranscribeAudioMutation } = TranscriptionSlice;
```

Then use in component:

```javascript
import { useTranscribeAudioMutation } from '../store/api/transcriptionSlice';

const MyComponent = () => {
  const [transcribeAudio, { isLoading }] = useTranscribeAudioMutation();

  const handleTranscription = async (audioUri) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    });

    try {
      const result = await transcribeAudio(formData).unwrap();
      console.log('Transcribed text:', result.text);
    } catch (error) {
      console.error('Transcription failed:', error);
    }
  };

  return (
    <VoiceInputButton onTranscriptionComplete={(uri) => handleTranscription(uri)} />
  );
};
```

**Important: Don't persist RTK Query slices**

```javascript
// store/store.js
const rootPersistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: [
    'transcriptionApi', // Add your API slice here
    // ... other RTK Query slices
  ],
};
```

---

## Multilingual Support

**Whisper automatically detects and transcribes multiple languages:**

- User speaks in **Tamil** → Transcribed as Tamil text
- User speaks in **English** → Transcribed as English text
- User speaks in **Spanish** → Transcribed as Spanish text
- Supports 97+ languages out of the box

**No additional configuration needed!** Whisper handles language detection automatically.

### Optional: Specify Language

```typescript
// In your service
formData.append('language', 'ta'); // Tamil
formData.append('language', 'en'); // English
```

---

## Best Practices

### 1. Audio Quality Settings

```javascript
// High quality for best transcription
Audio.RecordingOptionsPresets.HIGH_QUALITY

// Custom settings
{
  android: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
}
```

### 2. Error Handling

```javascript
// Frontend
try {
  const result = await transcribeAudio(formData).unwrap();
  onSuccess(result.text);
} catch (error) {
  if (error.status === 401) {
    // Handle auth errors
    showAuthError();
  } else if (error.status === 503) {
    // Service unavailable (missing API key)
    showConfigError();
  } else {
    // Generic error
    showGenericError(error.message);
  }
}
```

### 3. Loading States

Always show clear feedback:
- **Recording**: Pulsing mic icon + "Listening..." banner
- **Transcribing**: Loading spinner + "Converting speech to text..."
- **Error**: Error message with retry option

### 4. File Size Management

```javascript
// Set max recording duration
const MAX_DURATION_MS = 60000; // 60 seconds

setTimeout(() => {
  if (isRecording) {
    stopRecordingAndTranscribe();
    alert('Maximum recording duration reached');
  }
}, MAX_DURATION_MS);
```

### 5. Cleanup on Unmount

```javascript
useEffect(() => {
  return () => {
    // Cleanup recording if component unmounts
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }
  };
}, []);
```

---

## Cost Optimization

### OpenAI Whisper Pricing

- **$0.006 per minute** of audio
- 30-second recording = ~$0.003
- 2-minute recording = ~$0.012

### Cost-Saving Strategies

1. **Set maximum recording duration** (e.g., 60 seconds)
2. **Compress audio before upload** (if needed)
3. **Cache transcriptions** on backend for repeated requests
4. **Implement rate limiting** per user

### Example Cost Calculation

```
1000 users × 10 voice queries/month × 30 seconds average = 5000 minutes
Cost: 5000 × $0.006 = $30/month
```

---

## Common Issues & Solutions

### Issue 1: "Microphone permission denied"

**Solution:**
```javascript
// Check permission status before recording
const permission = await Audio.getPermissionsAsync();
if (!permission.granted) {
  const newPermission = await Audio.requestPermissionsAsync();
  if (!newPermission.granted) {
    Alert.alert(
      'Permission Required',
      'Please enable microphone access in Settings',
      [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
    );
    return;
  }
}
```

### Issue 2: "Recording not stopping properly"

**Solution:**
```javascript
// Always use try-finally for cleanup
try {
  await recordingRef.current.stopAndUnloadAsync();
} finally {
  recordingRef.current = null;
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  setIsRecording(false);
}
```

### Issue 3: "File upload fails"

**Solution:**
```javascript
// Ensure correct MIME type for platform
formData.append('audio', {
  uri: audioUri,
  type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mpeg',
  name: `recording-${Date.now()}.${Platform.OS === 'ios' ? 'm4a' : 'mp3'}`,
});
```

### Issue 4: "Backend receives empty file"

**Solution:**
```javascript
// Backend: Check file exists and has content
if (!file || !file.buffer || file.buffer.length === 0) {
  throw new HttpException('Empty audio file', HttpStatus.BAD_REQUEST);
}
```

### Issue 5: "401 Unauthorized Error"

**Solution:**
- Ensure Firebase/JWT token is fresh and not expired
- Check token is being sent in Authorization header
- Verify backend auth middleware is configured correctly

---

## Testing Checklist

- [ ] Microphone permission request works
- [ ] Recording starts and shows visual feedback
- [ ] Recording stops on button press
- [ ] Audio file is created and has content
- [ ] File uploads successfully to backend
- [ ] Backend receives file with correct format
- [ ] Whisper API returns transcription
- [ ] Transcribed text appears in UI
- [ ] Works with multiple languages (test 2-3)
- [ ] Error states are handled gracefully
- [ ] Loading indicators are clear
- [ ] Component cleanup on unmount works
- [ ] Works on both iOS and Android

---

## Security Considerations

1. **API Key Protection**
   - Never expose OpenAI API key in frontend
   - Always call Whisper API from backend
   - Use environment variables

2. **Authentication**
   - Require authentication for transcription endpoint
   - Implement rate limiting per user
   - Validate file size and format

3. **File Validation**
   ```javascript
   // Backend validation
   const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper limit)
   const ALLOWED_FORMATS = ['audio/m4a', 'audio/mpeg', 'audio/wav'];
   
   if (file.size > MAX_FILE_SIZE) {
     throw new HttpException('File too large', HttpStatus.BAD_REQUEST);
   }
   
   if (!ALLOWED_FORMATS.includes(file.mimetype)) {
     throw new HttpException('Invalid file format', HttpStatus.BAD_REQUEST);
   }
   ```

---

## Extending the Pattern

### Add Translation

```typescript
// After transcription, translate to another language
const translateText = async (text: string, targetLang: string) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Translate the following text to ${targetLang}. Only return the translation, no explanations.`,
        },
        { role: 'user', content: text },
      ],
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
};
```

### Add Voice Playback

```javascript
// Play transcribed text back as speech
import { Audio } from 'expo-av';

const playTranscription = async (text) => {
  // Use OpenAI TTS or similar service
  const audioUrl = await textToSpeech(text);
  
  const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
  await sound.playAsync();
};
```

### Offline Support

```javascript
// Use a lightweight on-device model for basic transcription
import Voice from '@react-native-voice/voice';

const useOfflineVoiceRecognition = () => {
  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      console.log('Offline transcription:', e.value);
    };
    
    return () => Voice.destroy().then(Voice.removeAllListeners);
  }, []);
  
  const startOfflineRecording = async () => {
    await Voice.start('en-US');
  };
};
```

---

## Reusable Code Snippets

### Custom Hook: `useVoiceInput`

```javascript
// hooks/useVoiceInput.js
import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform, Alert, Linking } from 'react-native';

export const useVoiceInput = (apiEndpoint, authToken) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);
  const recordingRef = useRef(null);

  const requestPermission = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Microphone Access Required',
        'Please enable microphone access to use voice input',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    try {
      setError(null);
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording');
      console.error(err);
    }
  };

  const stopAndTranscribe = async () => {
    try {
      setIsRecording(false);
      if (!recordingRef.current) return null;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (!uri) {
        setError('No audio recorded');
        return null;
      }

      setIsTranscribing(true);
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/m4a',
        name: 'recording.m4a',
      });

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();
      setIsTranscribing(false);

      if (!response.ok) {
        throw new Error(result.message || 'Transcription failed');
      }

      return result?.data?.text || null;
    } catch (err) {
      setIsTranscribing(false);
      setError(err.message || 'Transcription failed');
      console.error(err);
      return null;
    }
  };

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
        Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      }
    };
  }, []);

  return {
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopAndTranscribe,
  };
};
```

---

## Summary

This voice-to-text pattern provides:
- ✅ Multilingual support (97+ languages)
- ✅ High accuracy transcription
- ✅ Cross-platform compatibility (iOS/Android)
- ✅ Real-time visual feedback
- ✅ Error handling and recovery
- ✅ Scalable and cost-effective
- ✅ Easy to integrate into any React Native + Node.js app

**Total implementation time:** 2-4 hours for a complete, production-ready solution.

**Cost:** ~$0.003 per 30-second transcription (very affordable for most use cases).
