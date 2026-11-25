import { TextStyle } from 'react-native';
import { COLORS } from './colors';

export const FONTS = {
  regular: 'OptimisticApp',
  medium: 'OptimisticApp-Medium',
  bold: 'OptimisticApp-Bold',
  mono: 'monospace',
  feather: 'assets_fonts_feather',
} as const;

export const TYPOGRAPHY: Record<string, TextStyle> = {
  displayTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  titleLarge: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  titleMedium: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontFamily: FONTS.bold,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  bodyMedium: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  bodyMuted: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  caption: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  monoSmall: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.mono,
  },
};
