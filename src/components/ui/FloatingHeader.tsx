import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, GRADIENTS, LAYOUT, SPACING, COLORS } from '../../theme';
import HeaderButton from './HeaderButton';
import type { IconName } from './Icon';

interface FloatingHeaderProps {
  title?: string;
  leftIcon?: IconName;
  onLeftPress?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
  rightDisabled?: boolean;
  centerSlot?: ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
  zIndex?: number;
}

export default function FloatingHeader({
  title,
  leftIcon = 'chevron-left',
  onLeftPress,
  rightIcon,
  onRightPress,
  rightDisabled = false,
  centerSlot,
  onLayout,
  zIndex = 10,
}: FloatingHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { zIndex }]} onLayout={onLayout}>
      <LinearGradient
        colors={GRADIENTS.fadeTop}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.row, { paddingTop: insets.top + SPACING.md }]}>
        <HeaderButton icon={leftIcon} onPress={onLeftPress} />
        <View style={styles.center}>
          {centerSlot || (title ? <Text style={styles.title}>{title}</Text> : null)}
        </View>
        {rightIcon ? (
          <HeaderButton icon={rightIcon} onPress={onRightPress} disabled={rightDisabled} />
        ) : (
          <View style={styles.sideSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  sideSpacer: {
    width: LAYOUT.headerButtonSize,
  },
});
