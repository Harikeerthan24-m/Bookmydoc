import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import Global_Styles from '../../../utils/Global_Styles';
import {
  useChatMutation,
  useTranscribeAudioMutation,
} from '../../../store/slices';
import {
  getFallbackClassification,
} from '../../../services/aiClassificationService';

const ASK_AI_PLACEHOLDERS = [
  'e.g. Headache and fever for 2 days...',
  'e.g. Persistent cough and breathing difficulty...',
  'e.g. Skin rash and itching...',
  'e.g. Joint pain and stiffness...',
  'e.g. Stomach ache and digestion issues...',
  'e.g. Anxiety and difficulty sleeping...',
];

const Search = ({ onSearch, onSpecialistsSelected }) => {
  const [inputText, setInputText] = useState('');
  const [isAskAIMode, setIsAskAIMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [error, setError] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [chatMutation, { isLoading }] = useChatMutation();
  const [transcribeAudio, { isLoading: isTranscribing }] =
    useTranscribeAudioMutation();
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  const LINE_HEIGHT = 22;

  useEffect(() => {
    if (!isAskAIMode) return;

    const interval = setInterval(() => {
      const current = indexRef.current;
      const next = current >= ASK_AI_PLACEHOLDERS.length - 1 ? 0 : current + 1;

      Animated.timing(slideAnim, {
        toValue: -next * LINE_HEIGHT,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        indexRef.current = next;
        setPlaceholderIndex(next);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAskAIMode]);

  useEffect(() => {
    if (!isAskAIMode) {
      slideAnim.setValue(0);
      indexRef.current = 0;
      setPlaceholderIndex(0);
    }
  }, [isAskAIMode]);

  const handleSearchSubmit = () => {
    if (isAskAIMode) {
      handleAnalyze();
    } else {
      onSearch?.(inputText);
      setHasSearched(true);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please describe your symptoms or problem');
      return;
    }

    setError(null);
    setAiResults(null);

    try {
      const response = await chatMutation({
        message: inputText,
        inputType: 'text',
        source: 'search',
      }).unwrap();

      const specialist =
        response?.extractedInfo?.specialists?.[0] || 'General Physician';

      setAiResults({
        specialists: [
          {
            name: specialist,
            priority: 'high',
            reason: 'Recommended based on your symptoms',
          },
        ],
        urgency: response?.extractedInfo?.urgency || 'routine',
        summary:
          response?.extractedInfo?.summary ||
          (typeof response?.response === 'string' ? response.response : ''),
      });
    } catch (err) {
      console.error('Ask AI (search) error:', err);
      const fallbackResults = getFallbackClassification(inputText);
      setAiResults(fallbackResults);
      setError('Using offline classification. Results may be less accurate.');
    }
  };

  const handleFindDoctors = () => {
    if (aiResults?.specialists) {
      const specialistNames = aiResults.specialists.map((s) => s.name);
      onSpecialistsSelected?.(specialistNames, aiResults);
      handleClearAskAI();
    }
  };

  const handleClearAskAI = () => {
    setIsAskAIMode(false);
    setInputText('');
    setAiResults(null);
    setError(null);
  };

  const toggleAskAIMode = () => {
    if (isAskAIMode && !aiResults) {
      handleClearAskAI();
    } else if (!isAskAIMode) {
      setIsAskAIMode(true);
      setInputText('');
      setAiResults(null);
      setError(null);
      setPlaceholderIndex(0);
    } else {
      handleClearAskAI();
    }
  };

  // --- Voice Recording ---
  const startPulse = () => {
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
      ]),
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission is required for voice input');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setIsRecording(true);
      startPulse();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      stopPulse();
      setIsRecording(false);

      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (!uri) {
        setError('No audio recorded');
        return;
      }

      // Build FormData with the audio file
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/m4a',
        name: 'recording.m4a',
      });

      const response = await transcribeAudio(formData).unwrap();
      const transcribedText = response?.text || response?.data?.text;

      if (transcribedText) {
        setInputText(transcribedText);
      } else {
        setError('Could not understand the audio. Please try again.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError(
        typeof err === 'string'
          ? err
          : err?.message || 'Voice transcription failed',
      );
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecordingAndTranscribe();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      {/* Search / Ask AI Bar */}
      <View style={[styles.searchBar, isAskAIMode && styles.searchBarAskAI]}>
        <Ionicons
          name="search"
          size={24}
          color={isAskAIMode ? Global_Styles.PrimaryColour : '#979797'}
        />
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder={isAskAIMode ? '' : 'Search by name or specialties'}
            placeholderTextColor="#979797"
            style={styles.input}
            value={inputText}
            onChangeText={(value) => {
              setInputText(value);
              setError(null);
              if (!value.trim()) setHasSearched(false);
            }}
            onSubmitEditing={handleSearchSubmit}
            multiline={isAskAIMode}
            numberOfLines={isAskAIMode ? 2 : 1}
            textAlignVertical={isAskAIMode ? 'top' : 'center'}
          />
          {isAskAIMode && !inputText && (
            <View style={styles.placeholderOverlay} pointerEvents="none">
              <View style={[styles.placeholderClip, { height: LINE_HEIGHT }]}>
                <Animated.View
                  style={{
                    transform: [{ translateY: slideAnim }],
                  }}
                >
                  {ASK_AI_PLACEHOLDERS.map((text, i) => (
                    <Text
                      key={i}
                      style={[styles.placeholderText, { height: LINE_HEIGHT }]}
                      numberOfLines={1}
                    >
                      {text}
                    </Text>
                  ))}
                </Animated.View>
              </View>
            </View>
          )}
        </View>

        {/* Mic Button - Ask AI mode only */}
        {isAskAIMode && (
          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMicPress}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator
                size="small"
                color={Global_Styles.PrimaryColour}
              />
            ) : (
              <Animated.View
                style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}
              >
                <Ionicons
                  name={isRecording ? 'stop-circle' : 'mic'}
                  size={24}
                  color={isRecording ? '#FF3B30' : Global_Styles.PrimaryColour}
                />
              </Animated.View>
            )}
          </TouchableOpacity>
        )}

        {!isAskAIMode ? (
          !hasSearched ? (
            <TouchableOpacity
              style={[styles.askAIOnBar, styles.actionButton]}
              onPress={toggleAskAIMode}
            >
              <Ionicons
                name="sparkles"
                size={22}
                color={Global_Styles.PrimaryColour}
              />
            </TouchableOpacity>
          ) : null
        ) : (
          <>
            <TouchableOpacity
              style={[styles.askAIOnBar, styles.askAIOnBarActive]}
              onPress={toggleAskAIMode}
            >
              <Ionicons
                name="close"
                size={22}
                color={Global_Styles.PrimaryColour}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.analyzeButton]}
              onPress={handleSearchSubmit}
              disabled={isLoading || isRecording}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={Global_Styles.PrimaryColour}
                />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={Global_Styles.PrimaryColour}
                />
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingBanner}>
          <Animated.View
            style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]}
          />
          <Text style={styles.recordingText}>
            Listening... Tap the stop icon when done
          </Text>
        </View>
      )}

      {/* Transcribing indicator */}
      {isTranscribing && (
        <View style={styles.transcribingBanner}>
          <ActivityIndicator size="small" color={Global_Styles.PrimaryColour} />
          <Text style={styles.transcribingText}>
            Converting speech to text...
          </Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={18} color="#FF9500" />
          <Text style={styles.errorText}>
            {typeof error === 'string'
              ? error
              : typeof error?.message === 'string'
                ? error.message
                : 'Something went wrong'}
          </Text>
        </View>
      )}

      {/* AI Results Inline */}
      {aiResults && (
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Recommended Specialists</Text>
            <TouchableOpacity onPress={handleClearAskAI}>
              <Ionicons name="close-circle" size={22} color="#999" />
            </TouchableOpacity>
          </View>

          {aiResults.summary && (
            <Text style={styles.summaryText}>
              {typeof aiResults.summary === 'string'
                ? aiResults.summary
                : String(aiResults.summary ?? '')}
            </Text>
          )}

          <View style={styles.specialistChips}>
            {aiResults.specialists?.map((specialist, index) => (
              <View key={index} style={styles.specialistChip}>
                <Text style={styles.specialistChipText}>
                  {typeof specialist?.name === 'string'
                    ? specialist.name
                    : String(specialist?.name ?? '')}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.findDoctorsButton}
            onPress={handleFindDoctors}
          >
            <Ionicons name="search" size={20} color="white" />
            <Text style={styles.findDoctorsButtonText}>Find Doctors</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    marginTop: Constants.statusBarHeight,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 10,
    paddingRight: 6,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  searchBarAskAI: {
    alignItems: 'flex-start',
    minHeight: 50,
    paddingVertical: 10,
    paddingRight: 6,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 15,
    color: Global_Styles.TextColour,
    paddingVertical: 4,
    minHeight: 22,
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'flex-start',
  },
  placeholderClip: {
    overflow: 'hidden',
  },
  placeholderText: {
    fontSize: 15,
    color: '#979797',
    lineHeight: 22,
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    minWidth: 48,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'transparent',
    marginLeft: 8,
    alignSelf: 'center',
  },
  analyzeButton: {
    height: 42,
    minWidth: 48,
    paddingHorizontal: 14,
  },
  askAIOnBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 48,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'transparent',
    marginLeft: 8,
    alignSelf: 'center',
  },
  askAIOnBarActive: {
    backgroundColor: 'transparent',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
  },
  resultsCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Global_Styles.TextColour,
  },
  summaryText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    lineHeight: 18,
  },
  specialistChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  specialistChip: {
    backgroundColor: Global_Styles.PrimaryColour,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialistChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFF',
  },
  findDoctorsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Global_Styles.PrimaryColour,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  findDoctorsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  micButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F7FF',
    marginLeft: 6,
    alignSelf: 'center',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    flex: 1,
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
  },
  transcribingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 10,
  },
  transcribingText: {
    flex: 1,
    fontSize: 13,
    color: Global_Styles.PrimaryColour,
    fontWeight: '500',
  },
});
