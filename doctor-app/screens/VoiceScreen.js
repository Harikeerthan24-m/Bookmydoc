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
import {
  LiveKitRoom,
  registerGlobals,
  useVoiceAssistant,
  useConnectionState,
  AudioSession,
} from '@livekit/react-native';
import { ConnectionState } from 'livekit-client';
import { useGetRealtimeTokenMutation } from '../store/slices/voice.slice';

// Register LiveKit globals (WebRTC polyfills) — must be called once
registerGlobals();

const VOICE_STATES = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING',
};

/**
 * Inner component — must be inside <LiveKitRoom>.
 * useVoiceAssistant is the official hook for agent state.
 */
const RoomInternals = ({ onStateChange }) => {
  const connectionState = useConnectionState();
  const { agentState } = useVoiceAssistant();

  // Map connection state → voice state
  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      onStateChange(VOICE_STATES.LISTENING);
    } else if (connectionState === ConnectionState.Connecting) {
      onStateChange(VOICE_STATES.CONNECTING);
    } else if (connectionState === ConnectionState.Disconnected) {
      onStateChange(VOICE_STATES.IDLE);
    }
  }, [connectionState, onStateChange]);

  // Map agent state → voice state
  useEffect(() => {
    if (!agentState) return;
    if (agentState === 'speaking') onStateChange(VOICE_STATES.SPEAKING);
    else if (agentState === 'thinking' || agentState === 'processing') onStateChange(VOICE_STATES.PROCESSING);
    else if (agentState === 'listening') onStateChange(VOICE_STATES.LISTENING);
  }, [agentState, onStateChange]);

  return null; // Audio is handled natively by LiveKit — no UI component needed
};

const VoiceScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const circleSize = Math.min(width * 0.6, 260);

  const [voiceState, setVoiceState] = useState(VOICE_STATES.IDLE);
  const [error, setError] = useState(null);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [pendingDoctorCount, setPendingDoctorCount] = useState(0);

  const [getRealtimeToken, { isLoading: isTokenLoading }] = useGetRealtimeTokenMutation();

  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const stopAnimations = useCallback(() => {
    scale.stopAnimation();
    rotate.stopAnimation();
  }, [scale, rotate]);

  // Configure Audio Output to Loudspeaker
  useEffect(() => {
    const configureAndForceSpeaker = async () => {
      try {
        // 1. Configure audio routing preferences
        await AudioSession.configureAudio({
          android: {
            preferredOutputList: ['speaker', 'bluetooth', 'headset', 'earpiece'],
            audioTypeOptions: {
              manageAudioFocus: true,
              audioMode: 'inCommunication',
              audioFocusMode: 'gain',
              audioStreamType: 'voiceCall',
              audioAttributesUsageType: 'voiceCommunication',
              audioAttributesContentType: 'speech',
            },
          },
          ios: {
            defaultOutput: 'speaker',
          },
        });
        
        // 2. Start the session explicitly so we can select the output
        await AudioSession.startAudioSession();
        
        // 3. Force the output to the main speaker
        await AudioSession.selectAudioOutput(Platform.OS === 'ios' ? 'force_speaker' : 'speaker');
      } catch (err) {
        console.log('[Voice] Audio Config Error:', err);
      }
    };
    configureAndForceSpeaker();
  }, []);

  useEffect(() => {
    stopAnimations();
    scale.setValue(1);
    rotate.setValue(0);

    if (voiceState === VOICE_STATES.IDLE || voiceState === VOICE_STATES.CONNECTING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.05, duration: 1600, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1600, useNativeDriver: true }),
        ]),
      ).start();
    } else if (voiceState === VOICE_STATES.LISTENING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.25, duration: 350, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.05, duration: 350, useNativeDriver: true }),
        ]),
      ).start();
    } else if (voiceState === VOICE_STATES.PROCESSING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ).start();
      Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 3500, useNativeDriver: true })).start();
    } else if (voiceState === VOICE_STATES.SPEAKING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.2, duration: 450, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.02, duration: 450, useNativeDriver: true }),
        ]),
      ).start();
      Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 2200, useNativeDriver: true })).start();
    }

    return stopAnimations;
  }, [voiceState, scale, rotate, stopAnimations]);

  const rotateInterpolate = useMemo(
    () => rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
    [rotate],
  );

  const startConnection = async () => {
    try {
      setError(null);
      setVoiceState(VOICE_STATES.CONNECTING);
      const response = await getRealtimeToken().unwrap();
      if (response?.token) {
        setConnectionDetails(response);
      } else {
        throw new Error('Failed to get connection token');
      }
    } catch (err) {
      console.error('[Voice] Token error:', err);
      setError('Connection failed. Please check backend and .env settings.');
      setVoiceState(VOICE_STATES.IDLE);
    }
  };

  const handleMicPress = () => {
    if (voiceState === VOICE_STATES.IDLE) {
      startConnection();
    } else {
      setConnectionDetails(null);
      setVoiceState(VOICE_STATES.IDLE);
    }
  };

  const statusLabel = {
    [VOICE_STATES.IDLE]: 'Tap the mic to start talking',
    [VOICE_STATES.CONNECTING]: 'Connecting...',
    [VOICE_STATES.LISTENING]: 'Listening...',
    [VOICE_STATES.PROCESSING]: 'Processing...',
    [VOICE_STATES.SPEAKING]: 'AI is speaking...',
  }[voiceState];

  const voiceOrb = (
    <Animated.View style={{ transform: [{ scale }, { rotate: rotateInterpolate }] }}>
      <Svg width={circleSize} height={circleSize}>
        <Defs>
          <RadialGradient id="voiceGradient" cx="50%" cy="40%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="40%" stopColor="#a8d4ff" stopOpacity="0.95" />
            <Stop offset="70%" stopColor="#5ba3f5" stopOpacity="1" />
            <Stop offset="100%" stopColor="#2e7dd6" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Circle cx={circleSize / 2} cy={circleSize / 2} r={circleSize / 2 - 2} fill="url(#voiceGradient)" />
      </Svg>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.circleWrapper}>
        {connectionDetails ? (
          <LiveKitRoom
            serverUrl={connectionDetails.url}
            token={connectionDetails.token}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={() => {
              setConnectionDetails(null);
              setVoiceState(VOICE_STATES.IDLE);
            }}
          >
            <RoomInternals onStateChange={setVoiceState} />
            {voiceOrb}
          </LiveKitRoom>
        ) : (
          voiceOrb
        )}
      </View>

      <View style={styles.statusContainer}>
        {isTokenLoading && <Text style={styles.statusText}>Initializing AI...</Text>}
        {!isTokenLoading && <Text style={styles.statusText}>{statusLabel}</Text>}
        {error && <Text style={[styles.statusText, { color: 'red', marginTop: 10 }]}>{error}</Text>}
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
          style={[styles.actionButton, connectionDetails && styles.micActiveButton]}
          activeOpacity={0.7}
          onPress={handleMicPress}
        >
          <Ionicons
            name={connectionDetails ? 'mic' : 'mic-off'}
            size={28}
            color={connectionDetails ? '#000000' : '#ff3b30'}
          />
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
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 32 },
  circleWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusContainer: { alignItems: 'center', marginBottom: 20 },
  statusText: { fontSize: 14, color: '#666', fontWeight: '500' },
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
  },
  resultsNudgeText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
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
  micActiveButton: { backgroundColor: '#fff', borderColor: '#2e7dd6', borderWidth: 2 },
});

export default VoiceScreen;
