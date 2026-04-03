import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Colors = {
  primary: '#18A0FB',
  primaryLight: '#E1F6FF',
  primaryDark: '#0080CC',
  surface: '#FFFFFF',
  background: '#F9F9F9',
  textPrimary: '#1A1A2E',
  textSecondary: '#A6A3B8',
  textMuted: '#6B7280',
  border: '#EDEDED',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  white: '#FFFFFF',
  black: '#000000',
};

const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
};

const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

const Typography = {
  h1: { fontSize: 34, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '600' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '500' },
  bodySmall: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
};

const Screen = {
  width: SCREEN_WIDTH,
  cardWidth: SCREEN_WIDTH * 0.75,
  specialistWidth: SCREEN_WIDTH * 0.28,
};

// Reusable raised header shadow — apply to any header View
export const headerShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 5,
};

export default {
  // Legacy — keep for backward compatibility
  PrimaryColour: Colors.primary,
  MarginHorizontal: Spacing.xl,
  BorderRadius: Radius.lg,
  TextColour: Colors.textSecondary,

  // Design tokens
  Colors,
  Spacing,
  Radius,
  Typography,
  Screen,
  headerShadow,
};
