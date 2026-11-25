import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../theme';

interface ErrorMessageProps {
  message?: string | null;
  style?: StyleProp<TextStyle>;
  align?: 'left' | 'center' | 'right';
}

export default function ErrorMessage({ message, style, align }: ErrorMessageProps) {
  if (!message) return null;

  const isMultiline = message.includes('\n');
  const textAlign = align || (isMultiline ? 'left' : 'center');

  return (
    <Text
      style={[
        styles.errorText,
        { textAlign },
        isMultiline && styles.multiline,
        style,
      ]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: COLORS.statusDanger,
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  multiline: {
    lineHeight: 20,
    paddingHorizontal: SPACING.xxl,
  },
});
