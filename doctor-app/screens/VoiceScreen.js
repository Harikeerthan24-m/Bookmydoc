import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const VOICE_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING',
};

const VoiceScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  // Slightly smaller base size so the orb doesn't grow too large when animated
  const circleSize = Math.min(width * 0.6, 260);

  // Orb state
  const [voiceState, setVoiceState] = useState(VOICE_STATES.IDLE);

  // Animated values
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  // Helper to stop any running animations
  const stopAnimations = () => {
    scale.stopAnimation();
    rotate.stopAnimation();
  };
  // Start animations based on current voiceState
  useEffect(() => {
    stopAnimations();
    // Reset base values
    scale.setValue(1);
    rotate.setValue(0);
    if (voiceState === VOICE_STATES.IDLE) {
      // Slow breathing pulse
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
      // Stronger, faster pulse (pretend it's driven by mic amplitude)
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
      // Subtle pulse + slow rotation
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
      // Talking-like pulse + medium rotation
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

    // Cleanup when state changes/unmounts
    return stopAnimations;
  }, [voiceState, scale, rotate]);
  // Interpolate rotation value (0 → 1 → 0..360deg)
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

  // TEMP: cycle through states when you tap mic (for testing)
  const handleMicPress = () => {
    setVoiceState((prev) => {
      if (prev === VOICE_STATES.IDLE) return VOICE_STATES.LISTENING;
      if (prev === VOICE_STATES.LISTENING) return VOICE_STATES.PROCESSING;
      if (prev === VOICE_STATES.PROCESSING) return VOICE_STATES.SPEAKING;
      return VOICE_STATES.IDLE;
    });
  };

  return (
    <View style={styles.container}>
      {/* Central gradient circle (cloudy sky / ethereal effect) */}
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

      {/* Bottom control buttons */}
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
