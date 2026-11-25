import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '../../theme';

interface ScreenShellProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenShell({ children, style }: ScreenShellProps) {
  return (
    <View style={[styles.root, style]}>
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
