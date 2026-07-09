// Field Ops Premium — Design Tokens
import { Platform } from 'react-native';

export const colors = {
  primary: '#2563EB',        // Modern vibrant blue
  primaryDark: '#1D4ED8',
  primaryContainer: '#EFF6FF',
  secondary: '#F59E0B',      // Amber
  secondaryDark: '#D97706',
  success: '#10B981',        // Emerald
  successBg: '#D1FAE5',
  error: '#EF4444',          // Red
  errorBg: '#FEE2E2',
  surface: '#FFFFFF',
  surfaceContainer: '#F8FAFC',
  surfaceContainerLow: '#F1F5F9',
  white: '#FFFFFF',
  navy: '#0F172A',           // Slate 900
  onSurface: '#1E293B',      // Slate 800
  onSurfaceVariant: '#475569', // Slate 600
  outline: '#CBD5E1',        // Slate 300
  outlineVariant: '#E2E8F0', // Slate 200
  inverseNavy: '#1E293B',
  pending: '#FEF3C7',
  pendingBorder: '#F59E0B',
  bg: '#F8FAFC',
  placeholder: '#94A3B8',    // Slate 400
  muted: '#64748B',          // Slate 500
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  displayLg: { fontFamily: 'HankenGrotesk-Bold', fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  headlineMd: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 24, lineHeight: 32 },
  headlineSm: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 20, lineHeight: 28 },
  bodyLg: { fontFamily: 'HankenGrotesk-Regular', fontSize: 18, lineHeight: 26 },
  bodyMd: { fontFamily: 'HankenGrotesk-Regular', fontSize: 16, lineHeight: 24 },
  labelMd: { fontFamily: 'HankenGrotesk-Medium', fontSize: 14, lineHeight: 20, letterSpacing: 0.5 },
  labelSm: { fontFamily: 'HankenGrotesk-Bold', fontSize: 12, lineHeight: 16, letterSpacing: 0.8 },
};

export const shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
    android: { elevation: 2 },
    web: { boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }
  }),
  md: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 4 },
    web: { boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.06)' }
  }),
  lg: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20 },
    android: { elevation: 8 },
    web: { boxShadow: '0 10px 25px -3px rgba(15, 23, 42, 0.08)' }
  }),
  primary: Platform.select({
    ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
    android: { elevation: 8, shadowColor: colors.primary },
    web: { boxShadow: '0 8px 16px -3px rgba(37, 99, 235, 0.25)' }
  }),
};
