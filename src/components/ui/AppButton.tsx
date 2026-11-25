import { ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, FONTS, RADII } from '../../theme';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'magenta' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: AppButtonProps) {
  const isBusy = loading || disabled;
  const spinnerColor = variant === 'primary' ? COLORS.textDark : COLORS.textPrimary;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isBusy}
      onPress={onPress}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'magenta' && styles.magenta,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        isBusy && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelDark,
            variant === 'danger' && styles.labelDanger,
          ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADII.xxl,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.textPrimary,
  },
  magenta: {
    backgroundColor: COLORS.brandMagenta,
  },
  secondary: {
    backgroundColor: COLORS.surfaceElevated,
  },
  danger: {
    backgroundColor: COLORS.statusDangerBg,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  labelDark: {
    color: COLORS.textDark,
  },
  labelDanger: {
    color: COLORS.statusDangerAlt,
  },
});
