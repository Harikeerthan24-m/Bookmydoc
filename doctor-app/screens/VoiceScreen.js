import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {
  useTranscribeAudioMutation,
  useTtsMutation,
  useChatMutation,
} from '../store/slices/ai.slice';

const VOICE_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING',
};

const VoiceScreen = () => {
  const navigation = useNavigation();
  const user = useSelector((state) => state.authSlice?.user);
  const profile = useSelector((state) => state.authSlice?.profile);
  const userName =
    profile?.display_name || user?.displayName || user?.display_name || '';
  const { width } = useWindowDimensions();
  const circleSize = Math.min(width * 0.6, 260);

  const [voiceState, setVoiceState] = useState(VOICE_STATES.IDLE);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const recordingRef = useRef(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [pendingDoctorCount, setPendingDoctorCount] = useState(0);

  const [transcribeAudio] = useTranscribeAudioMutation();
  const [chatMutation] = useChatMutation();
  const [tts] = useTtsMutation();

  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const stopAnimations = () => {
    scale.stopAnimation();
    rotate.stopAnimation();
  };

  useEffect(() => {
    stopAnimations();
    scale.setValue(1);
    rotate.setValue(0);

    if (voiceState === VOICE_STATES.IDLE) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else if (voiceState === VOICE_STATES.LISTENING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.25,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else if (voiceState === VOICE_STATES.PROCESSING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ).start();
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
      ).start();
    } else if (voiceState === VOICE_STATES.SPEAKING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.02,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ).start();
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ).start();
    }

    return stopAnimations;
  }, [voiceState, scale, rotate]);

  const rotateInterpolate = useMemo(
    () =>
      rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [rotate],
  );

  const isMicListening = voiceState === VOICE_STATES.LISTENING;
  const micButtonStyle = [
    styles.actionButton,
    !isMicListening && styles.micMutedButton,
  ];
  const micIconName = isMicListening ? 'mic' : 'mic-off';
  const micIconColor = isMicListening ? '#000000' : '#ff3b30';

  const startRecording = useCallback(async () => {
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
      setVoiceState(VOICE_STATES.LISTENING);
    } catch (err) {
      console.error('[Voice] Failed to start recording:', err);
      setError('Failed to start recording');
      setIsRecording(false);
      setVoiceState(VOICE_STATES.IDLE);
    }
  }, []);

  const stopRecordingAndProcess = useCallback(async () => {
    try {
      if (!recordingRef.current) {
        setIsRecording(false);
        setVoiceState(VOICE_STATES.IDLE);
        return;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      setIsRecording(false);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (!uri) {
        setError('No audio recorded');
        setVoiceState(VOICE_STATES.IDLE);
        return;
      }

      setVoiceState(VOICE_STATES.PROCESSING);

      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/m4a',
        name: 'recording.m4a',
      });

      const transcribeResponse = await transcribeAudio(formData).unwrap();
      const transcribedText =
        transcribeResponse?.text || transcribeResponse?.data?.text;

      if (!transcribedText) {
        setError('Could not understand the audio. Please try again.');
        setVoiceState(VOICE_STATES.IDLE);
        return;
      }

      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: transcribedText },
      ];

      const chatResponse = await chatMutation({
        message: transcribedText,
        conversationHistory:
          conversationHistory.length > 0 ? conversationHistory : undefined,
        userName: userName || undefined,
        inputType: 'voice',
      }).unwrap();

      const assistantText = chatResponse?.response;
      setConversationHistory(
        chatResponse?.conversationHistory || updatedHistory,
      );
      const doctorCount = chatResponse?.doctorRecommendations?.length ?? 0;
      if (doctorCount > 0) setPendingDoctorCount(doctorCount);

      if (!assistantText) {
        setError('Assistant did not return a response.');
        setVoiceState(VOICE_STATES.IDLE);
        return;
      }

      const ttsResult = await tts({ text: assistantText }).unwrap();
      if (ttsResult?.audioBase64) {
        const fileUri = `${FileSystem.cacheDirectory}voice-assistant-${Date.now()}.mp3`;
        await FileSystem.writeAsStringAsync(fileUri, ttsResult.audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setVoiceState(VOICE_STATES.SPEAKING);

        const { sound } = await Audio.Sound.createAsync(
          { uri: fileUri },
          { shouldPlay: true },
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            sound.unloadAsync();
            setVoiceState(VOICE_STATES.IDLE);
          }
        });
      } else {
        setVoiceState(VOICE_STATES.IDLE);
      }
    } catch (err) {
      console.error('[Voice] Error during voice pipeline:', err);
      setError(
        typeof err === 'string'
          ? err
          : err?.message || 'Voice assistant failed. Please try again.',
      );
      setVoiceState(VOICE_STATES.IDLE);
    }
  }, [chatMutation, conversationHistory, transcribeAudio, tts, userName]);

  const handleMicPress = async () => {
    if (!isRecording && voiceState !== VOICE_STATES.SPEAKING) {
      await startRecording();
    } else if (isRecording && voiceState === VOICE_STATES.LISTENING) {
      await stopRecordingAndProcess();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleWrapper}>
        <Animated.View
          style={{
            transform: [{ scale }, { rotate: rotateInterpolate }],
          }}
        >
          <Svg width={circleSize} height={circleSize}>
            <Defs>
              <RadialGradient id="voiceGradient" cx="50%" cy="40%" r="50%">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <Stop offset="40%" stopColor="#a8d4ff" stopOpacity="0.95" />
                <Stop offset="70%" stopColor="#5ba3f5" stopOpacity="1" />
                <Stop offset="100%" stopColor="#2e7dd6" stopOpacity="1" />
              </RadialGradient>
            </Defs>
            <Circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={circleSize / 2 - 2}
              fill="url(#voiceGradient)"
            />
          </Svg>
        </Animated.View>
      </View>

      {pendingDoctorCount > 0 && (
        <TouchableOpacity
          style={styles.resultsNudge}
          activeOpacity={0.85}
          onPress={() => {
            setPendingDoctorCount(0);
            navigation.navigate('Chat');
          }}
        >
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          <Text style={styles.resultsNudgeText}>
            I found {pendingDoctorCount} doctor{pendingDoctorCount !== 1 ? 's' : ''} for you. Tap to see them in Chat →
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={micButtonStyle}
          activeOpacity={0.7}
          onPress={handleMicPress}
        >
          <Ionicons name={micIconName} size={28} color={micIconColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(255, 255, 255)',
    paddingHorizontal: 32,
  },
  circleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#2e7dd6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginBottom: 16,
    gap: 8,
    maxWidth: '90%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  resultsNudgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 48,
    paddingHorizontal: 8,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micMutedButton: {
    backgroundColor: '#2b0000',
    borderWidth: 1,
  },
});

export default VoiceScreen;
