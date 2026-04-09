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
  PermissionsAndroid,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AISlice } from '../store/slices/ai.slice';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  LiveKitRoom,
  registerGlobals,
  useConnectionState,
  AudioSession,
  useRoomContext,
} from '@livekit/react-native';
import { ConnectionState, RoomEvent, TrackEvent } from 'livekit-client';
import { useGetRealtimeTokenMutation } from '../store/slices/voice.slice';

// Register LiveKit globals (WebRTC polyfills) — must be called once
registerGlobals();

const VOICE_STATES = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  INITIALIZING: 'INITIALIZING',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SEARCHING: 'SEARCHING',
  SPEAKING: 'SPEAKING',
};

/**
 * Inner component — must be inside <LiveKitRoom>.
 * useVoiceAssistant is the official hook for agent state.
 */
const RoomInternals = ({ onStateChange, onDoctorsFound }) => {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const agentState = null; // useVoiceAssistant removed — it's a web-only hook

  // Debug connection state changes
  useEffect(() => {
    console.log('[Voice] connectionState:', connectionState, '| agentState:', agentState, '| Room ready:', !!room);
  }, [connectionState, agentState, room]);

  // Mic is enabled by LiveKitRoom audio={true} on SignalConnected — no manual enableMic needed.

  // Confirm when our audio track actually makes it to the server
  useEffect(() => {
    if (!room) return;
    const handleLocalTrack = async (pub) => {
      console.log(`[Voice] LOCAL TRACK PUBLISHED: ${pub.kind}`);
      if (onStateChange) onStateChange(VOICE_STATES.LISTENING);

      // Force speaker AFTER the mic track is published and WebRTC negotiation is done.
      // Android resets audio routing to earpiece during WebRTC setup even if you called
      // selectAudioOutput earlier — so this is the correct moment to apply it.
      if (pub.kind === 'audio') {
        try {
          await AudioSession.selectAudioOutput(Platform.OS === 'ios' ? 'force_speaker' : 'speaker');
          console.log('[Voice] Speaker output forced.');
        } catch (err) {
          console.log('[Voice] Could not force speaker:', err);
        }
      }
    };
    room.localParticipant.on(TrackEvent.LocalTrackPublished, handleLocalTrack);
    return () => room.localParticipant.off(TrackEvent.LocalTrackPublished, handleLocalTrack);
  }, [room, onStateChange]);

  // Listen for agent DataPackets (e.g. "I found 3 doctors")
  useEffect(() => {
    if (!room) return;
    
    const handleData = (payload, participant, kind, topic) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);
        
        if (data.type === 'searching_doctors' || topic === 'searching_doctors') {
          if (onStateChange) onStateChange(VOICE_STATES.SEARCHING);
        } else if (data.type === 'doctors_found' || topic === 'doctors_found') {
          if (onDoctorsFound && data.count > 0) {
            onDoctorsFound(data.count);
          }
        }
      } catch (err) {
        console.warn('Failed to parse incoming data packet', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, onDoctorsFound]);

  // Map connection state → voice state
  useEffect(() => {
    if (connectionState === ConnectionState.Connecting) {
      onStateChange(VOICE_STATES.CONNECTING);
    } else if (connectionState === ConnectionState.Connected) {
      // Don't set LISTENING yet! Let agentState drive it. But if agentState is empty, default to INITIALIZING
      if (!agentState || agentState === 'disconnected') {
        onStateChange(VOICE_STATES.INITIALIZING);
      }
    } else if (connectionState === ConnectionState.Disconnected) {
      onStateChange(VOICE_STATES.IDLE);
    }
  }, [connectionState, agentState, onStateChange]);

  // Map agent state → voice state
  useEffect(() => {
    if (!agentState) return;
    if (agentState === 'disconnected') onStateChange(VOICE_STATES.IDLE);
    else if (agentState === 'connecting' || agentState === 'initializing') onStateChange(VOICE_STATES.INITIALIZING);
    else if (agentState === 'speaking') onStateChange(VOICE_STATES.SPEAKING);
    else if (agentState === 'thinking' || agentState === 'processing') onStateChange(VOICE_STATES.PROCESSING);
    else if (agentState === 'listening') onStateChange(VOICE_STATES.LISTENING);
  }, [agentState, onStateChange]);

  // Fallback: OpenAI Realtime models don't always emit 'listening'.
  // If we're still INITIALIZING after 4s while connected, forcibly move to LISTENING.
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;

    const timer = setTimeout(() => {
      // Nudge only if agent hasn't explicitly said it's doing something else
      if (!agentState || agentState === 'initializing') {
        onStateChange(VOICE_STATES.LISTENING);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [connectionState, agentState, onStateChange]);

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
  
  const dispatch = useDispatch();

  const handleDoctorsFound = useCallback((count) => {
    setPendingDoctorCount(count);
    // ⚡ SUPER PRE-FETCH MAGIC: 
    // InvalidateTags only works if ChatScreen is currently mounted/subscribed.
    // By dispatching initiate(), we force RTK Query to silently execute the network call in the background RIGHT NOW.
    // By the time the user taps the notification, the chat history represents 0ms of wait time!
    dispatch(AISlice.endpoints.getChatHistory.initiate({ limit: 25 }, { forceRefetch: true }));
  }, [dispatch]);

  const [getRealtimeToken, { isLoading: isTokenLoading }] = useGetRealtimeTokenMutation();

  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const stopAnimations = useCallback(() => {
    scale.stopAnimation();
    rotate.stopAnimation();
  }, [scale, rotate]);

  // Configure audio on mount using the LiveKit communication preset.
  // This is the officially recommended config for voice/communication apps.
  // startAudioSession() is called in handleMicPress (before connect) so config
  // is applied before WebRTC negotiation starts.
  useEffect(() => {
    AudioSession.configureAudio({
      android: {
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
    }).catch(err => console.log('[Voice] Audio config error:', err));
  }, []);

  useEffect(() => {
    stopAnimations();
    scale.setValue(1);
    rotate.setValue(0);

    if (
      voiceState === VOICE_STATES.IDLE ||
      voiceState === VOICE_STATES.CONNECTING ||
      voiceState === VOICE_STATES.INITIALIZING
    ) {
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
    } else if (
      voiceState === VOICE_STATES.PROCESSING || 
      voiceState === VOICE_STATES.SEARCHING
    ) {
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

  const handleMicPress = async () => {
    if (voiceState === VOICE_STATES.IDLE) {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Book My Doctor needs access to your microphone so you can talk to the AI assistant.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError('Microphone permission denied.');
          return;
        }
      }
      // Start audio session BEFORE connecting — LiveKit docs require this order:
      // configureAudio → startAudioSession → connect → setMicrophoneEnabled
      // Starting after connect means WebRTC negotiates without a live audio session,
      // causing the mic to capture in an uninitialized state (silence).
      try {
        await AudioSession.startAudioSession();
        console.log('[Voice] Audio session started (pre-connect).');
      } catch (err) {
        console.warn('[Voice] startAudioSession pre-connect failed:', err);
      }
      startConnection();
    } else {
      setConnectionDetails(null);
      setVoiceState(VOICE_STATES.IDLE);
      AudioSession.stopAudioSession().catch(() => {});
    }
  };

  const statusLabel = {
    [VOICE_STATES.IDLE]: '🎙️ Tap the mic to start talking',
    [VOICE_STATES.CONNECTING]: '🔗 Connecting to Server...',
    [VOICE_STATES.INITIALIZING]: '⚡ Waking up AI (just a moment)...',
    [VOICE_STATES.LISTENING]: '👂 I am listening! Go ahead...',
    [VOICE_STATES.PROCESSING]: '🧠 AI is thinking...',
    [VOICE_STATES.SEARCHING]: '🔍 Searching hospitals for best doctors...',
    [VOICE_STATES.SPEAKING]: '🤖 AI is speaking...',
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
              // Stop the audio session so it doesn't leak into the next connection.
              // LiveKit starts the session when the mic is enabled; we must stop it
              // explicitly to allow clean state on reconnect.
              AudioSession.stopAudioSession().catch(() => {});
            }}
          >
            <RoomInternals onStateChange={setVoiceState} onDoctorsFound={handleDoctorsFound} />
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
