import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';

interface ScreenShellProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  safeBottom?: boolean;
}

export default function ScreenShell({ children, style, safeBottom = true }: ScreenShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, safeBottom && { paddingBottom: insets.bottom }, style]}>
      <StatusBar style="light" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
});
