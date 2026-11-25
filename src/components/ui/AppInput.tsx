import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  hint?: string;
  variant?: 'pill' | 'card' | 'mono';
  containerStyle?: StyleProp<ViewStyle>;
}

export default function AppInput({
  label,
  hint,
  variant = 'pill',
  containerStyle,
  style,
  ...rest
}: AppInputProps) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={COLORS.textMuted}
        style={[
          styles.input,
          variant === 'card' && styles.cardInput,
          variant === 'mono' && styles.monoInput,
          style,
        ]}
        {...rest}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  cardInput: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monoInput: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: FONTS.mono,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  hint: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 4,
    marginLeft: 4,
  },
});
