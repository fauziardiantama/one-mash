import { ReactNode, useEffect } from 'react';
import { BackHandler, Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Reanimated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, RADII, SPACING } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InTreeBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function InTreeBottomSheet({
  visible,
  onClose,
  children,
}: InTreeBottomSheetProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 280 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
  }, [visible, progress]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [SCREEN_HEIGHT, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <Reanimated.View pointerEvents={visible ? 'auto' : 'none'} style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Reanimated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      <Reanimated.View style={[styles.container, sheetStyle]}>
        <View style={styles.grabber} />
        {children}
      </Reanimated.View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    zIndex: 100,
    elevation: 30,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.overlayScrimHeavy,
  },
  container: {
    backgroundColor: COLORS.surfaceCard,
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    maxHeight: '78%',
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
    elevation: 20,
  },
  grabber: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
});
