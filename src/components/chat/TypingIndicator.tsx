import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS, RADII, SPACING } from '../../theme';

export default function TypingIndicator() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: 1200, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const dotStyle = (inputRange: number[]) => ({
    transform: [
      { scale: progress.interpolate({ inputRange, outputRange: [1, 1, 1.35, 1, 1] }) },
      { translateY: progress.interpolate({ inputRange, outputRange: [0, 0, -2, 0, 0] }) },
    ],
    opacity: progress.interpolate({ inputRange, outputRange: [0.5, 0.5, 1, 0.5, 0.5] }),
  });

  return (
    <View style={styles.bubble}>
      <Animated.View style={[styles.dot, dotStyle([0, 0.15, 0.3, 0.45, 1])]} />
      <Animated.View style={[styles.dot, dotStyle([0, 0.35, 0.5, 0.65, 1])]} />
      <Animated.View style={[styles.dot, dotStyle([0, 0.55, 0.7, 0.85, 1])]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 3,
  },
});
