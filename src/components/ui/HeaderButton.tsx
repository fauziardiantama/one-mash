import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, LAYOUT } from '../../theme';
import Icon, { type IconName } from './Icon';

interface HeaderButtonProps {
  icon: IconName;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function HeaderButton({ icon, onPress, disabled = false, style }: HeaderButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      style={[styles.button, disabled && styles.disabled, style]}>
      <Icon name={icon} size={24} color={COLORS.textPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: LAYOUT.headerButtonSize,
    height: LAYOUT.headerButtonSize,
    borderRadius: LAYOUT.headerButtonSize / 2,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});
