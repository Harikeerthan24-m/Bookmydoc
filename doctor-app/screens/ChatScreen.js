import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {
  useChatMutation,
  useTranscribeAudioMutation,
  useTtsMutation,
} from '../store/slices/ai.slice';
import Global_Styles from '../utils/Global_Styles';
import ProfileImage from '../assets/images/doc1.png';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WELCOME_TEXT = 'Your AI Health care Assistant';

const ChatScreen = () => {
  const navigation = useNavigation();
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const [chatMutation] = useChatMutation();
  const [transcribeAudio, { isLoading: isTranscribing }] =
    useTranscribeAudioMutation();
  const [tts] = useTtsMutation();
  const showWelcome = messages.length === 0;
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const recordingRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // Add user message to UI
      const userMessage = {
        id: Date.now().toString(),
        text: trimmed,
        isUser: true,
      };
      setMessages((prev) => [...prev, userMessage]);
      setMessageText('');
      setIsLoading(true);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Update conversation history for API
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: trimmed },
      ];

      try {
        const response = await chatMutation({
          message: trimmed,
          conversationHistory:
            conversationHistory.length > 0 ? conversationHistory : undefined,
        }).unwrap();

        // Add assistant response to UI
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          isUser: false,
          doctors: Array.isArray(response?.doctorRecommendations)
            ? response.doctorRecommendations
            : [],
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Voice output: ask backend to synthesize speech for the assistant reply
        try {
          const ttsResult = await tts({ text: response.response }).unwrap();
          if (ttsResult?.audioBase64) {
            const fileUri = `${FileSystem.cacheDirectory}assistant-${Date.now()}.mp3`;
            await FileSystem.writeAsStringAsync(
              fileUri,
              ttsResult.audioBase64,
              { encoding: FileSystem.EncodingType.Base64 },
            );

            await Audio.Sound.createAsync(
              { uri: fileUri },
              { shouldPlay: true },
            );
          }
        } catch (ttsError) {
          console.warn('[Chat] Failed to play assistant audio:', ttsError);
        }

        // Update conversation history
        setConversationHistory(response.conversationHistory || updatedHistory);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('[Chat] Error:', error);
        // Add error message
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: 'I apologize, but I encountered an error. Please try again or check your connection.',
          isUser: false,
        };
        setMessages((prev) => [...prev, errorMessage]);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } finally {
        setIsLoading(false);
      }
    },
    [chatMutation, conversationHistory, isLoading],
  );

  const handleSend = useCallback(() => {
    if (!messageText.trim()) return;
    sendMessage(messageText);
  }, [messageText, sendMessage]);

  const renderDoctorCard = useCallback(
    (doctor) => {
      const docForProfile = {
        uid: doctor?.doctorId,
        display_name: doctor?.name,
        star_rating: doctor?.rating,
        expertiseList: doctor?.specialization ? [doctor.specialization] : [],
        location: {
          city: doctor?.location,
        },
      };

      return (
        <TouchableOpacity
          key={doctor?.doctorId || `${doctor?.name}-${doctor?.specialization}`}
          style={styles.docItem}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('DoctorProfile', { doctor: docForProfile })
          }
        >
          <View style={styles.docImageContainer}>
            <Image style={styles.photoUrl} source={ProfileImage} />
          </View>
          <View style={styles.docTextContainer}>
            <Text style={styles.docName}>{doctor?.name}</Text>
            <Text style={styles.docDesignation}>
              {doctor?.specialization || ''}
            </Text>
            <View style={styles.docBottomContainer}>
              <View style={styles.docTimingContainer}>
                <Text style={styles.docTiming}>
                  {doctor?.location ? String(doctor.location) : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.docPlusIconContainer}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('DoctorProfile', {
                    doctor: docForProfile,
                  })
                }
              >
                <FontAwesome name="plus" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation],
  );

  const renderMessage = useCallback(
    ({ item }) => {
      const isUser = item.isUser;
      return (
        <View>
          <View
            style={[
              styles.bubbleRow,
              isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
            ]}
          >
            <View
              style={[
                styles.bubble,
                isUser ? styles.bubbleUser : styles.bubbleAssistant,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                ]}
              >
                {item.text}
              </Text>
            </View>
          </View>

          {!isUser &&
            Array.isArray(item?.doctors) &&
            item.doctors.length > 0 && (
              <View style={styles.doctorsWrap}>
                {item.doctors.map(renderDoctorCard)}
              </View>
            )}
        </View>
      );
    },
    [renderDoctorCard],
  );

  const renderThinkingIndicator = useCallback(() => {
    if (!isLoading) return null;

    return (
      <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
        <View
          style={[styles.bubble, styles.bubbleAssistant, styles.thinkingBubble]}
        >
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.thinkingText}>AI is thinking...</Text>
          </View>
        </View>
      </View>
    );
  }, [isLoading]);

  const canSend = messageText.trim().length > 0 && !isLoading;

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
        // Option A: auto-send as a chat message
        await sendMessage(transcribedText);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.chatContainer}>
        {showWelcome ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeBubble}>
              <Text style={styles.welcomeText}>{WELCOME_TEXT}</Text>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            ListFooterComponent={renderThinkingIndicator}
          />
        )}
      </View>

      <View style={styles.inputBar}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="How are you feeling today!!"
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMicPress}
            disabled={isTranscribing || isLoading}
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
                  size={22}
                  color={isRecording ? '#FF3B30' : '#000'}
                />
              </Animated.View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            activeOpacity={0.7}
            disabled={!canSend}
          >
            <Ionicons
              name="send"
              size={22}
              color={canSend ? '#ffffff' : '#999'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.waveformButton}
            onPress={() => navigation.navigate('Voice')}
          >
            <MaterialCommunityIcons name="waveform" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBubble: {
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  bubbleRow: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  bubbleRowUser: {
    alignSelf: 'flex-end',
  },
  bubbleRowAssistant: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: '#009EFF',
  },
  bubbleAssistant: {
    backgroundColor: '#f0f4f8',
  },
  bubbleText: {
    fontSize: 16,
  },
  bubbleTextUser: {
    color: '#ffffff',
  },
  bubbleTextAssistant: {
    color: '#333',
  },
  doctorsWrap: {
    marginTop: 10,
    gap: 10,
  },
  thinkingBubble: {
    minWidth: 120,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#009EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },

  waveformButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Doctor card styles (match Explore search card pattern)
  micButton: {
    marginRight: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  docImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F3F3F3',
  },
  docImage: {
    width: '100%',
    height: '100%',
  },
  docTextContainer: {
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  docDesignation: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: Global_Styles.PrimaryColour,
  },
  docBottomContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docTimingContainer: {
    flex: 1,
    paddingRight: 10,
  },
  docTiming: {
    fontSize: 12,
    color: '#6B7280',
  },
  docPlusIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Global_Styles.PrimaryColour,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
