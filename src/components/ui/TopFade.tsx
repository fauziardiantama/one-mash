import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { GRADIENTS } from '../../theme';

interface TopFadeProps {
  height?: number;
  position?: 'top' | 'bottom';
}

export default function TopFade({ height = 28, position = 'top' }: TopFadeProps) {
  const isBottom = position === 'bottom';
  return (
    <LinearGradient
      colors={isBottom ? GRADIENTS.fadeBottom : GRADIENTS.fadeTop}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[isBottom ? styles.bottom : styles.top, { height }]}
      pointerEvents="none"
    />
  );
}

export function BottomFade({ height = 12 }: { height?: number }) {
  return <TopFade height={height} position="bottom" />;
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
