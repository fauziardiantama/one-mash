import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADII, SHADOWS, SPACING } from '../../theme';

interface LoadingOverlayProps {
  visible?: boolean;
  message?: string;
}

export default function LoadingOverlay({ visible = false, message = '' }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={message ? styles.card : styles.circle}>
        <ActivityIndicator size="large" color={COLORS.textPrimary} />
        {Boolean(message) && <Text style={styles.text}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlayScrim,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.overlay,
  },
  card: {
    borderRadius: RADII.xl,
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: 28,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.overlay,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
