import { StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, LAYOUT, SPACING } from '../../theme';
import Icon from '../ui/Icon';

interface ScrollToBottomButtonProps {
  visible: boolean;
  onPress: () => void;
}

export default function ScrollToBottomButton({ visible, onPress }: ScrollToBottomButtonProps) {
  if (!visible) return null;

  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={onPress}>
      <Icon name="arrow-down" size={22} color={COLORS.textPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: SPACING.md,
    left: '50%',
    marginLeft: -LAYOUT.headerButtonSize / 2,
    width: LAYOUT.headerButtonSize,
    height: LAYOUT.headerButtonSize,
    borderRadius: LAYOUT.headerButtonSize / 2,
    backgroundColor: COLORS.brandMagenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
