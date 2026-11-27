import { ReactNode, useEffect, useRef } from 'react';
import {
  BackHandler,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { KeyboardAvoidingView, useKeyboardHandler } from 'react-native-keyboard-controller';
import Reanimated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SPACING } from '../../theme';

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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);
  const wasVisibleRef = useRef(visible);

  useKeyboardHandler(
    {
      onMove: (e) => {
        'worklet';
        keyboardHeight.value = Math.max(e.height, 0);
      },
      onEnd: (e) => {
        'worklet';
        keyboardHeight.value = Math.max(e.height, 0);
      },
    },
    [],
  );

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 280 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
    if (wasVisibleRef.current && !visible) {
      Keyboard.dismiss();
    }
    wasVisibleRef.current = visible;
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

  const topClearance = insets.top + SPACING.md;

  const sheetStyle = useAnimatedStyle(() => {
    const kbOpen = keyboardHeight.value > 0;
    const maxHeight = kbOpen
      ? Math.max(200, windowHeight - topClearance - keyboardHeight.value)
      : Math.round(windowHeight * 0.78);
    return {
      maxHeight,
      paddingBottom: kbOpen ? SPACING.md : SPACING.xxxl,
      transform: [
        {
          translateY: interpolate(progress.value, [0, 1], [windowHeight, 0], Extrapolation.CLAMP),
        },
      ],
    };
  }, [windowHeight, topClearance]);

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={styles.root}>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          onClose();
        }}>
        <Reanimated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior="padding"
        automaticOffset
        pointerEvents={visible ? 'box-none' : 'none'}
        style={styles.overlay}>
        <Reanimated.View style={[styles.container, sheetStyle]}>
          <View style={styles.grabber} />
          {children}
        </Reanimated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 100,
    elevation: 30,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
