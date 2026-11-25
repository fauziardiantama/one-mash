import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [timedOut, setTimedOut] = useState(false);

  const [fontsLoaded, fontError] = Font.useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    OptimisticApp: require('../../assets/fonts/OptimisticApp-Regular.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'OptimisticApp-Medium': require('../../assets/fonts/OptimisticApp-Medium.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'OptimisticApp-Bold': require('../../assets/fonts/OptimisticApp-Bold.ttf'),
  });

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || timedOut) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, timedOut]);

  return (
    <KeyboardProvider preload={false}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.canvas },
            animation: 'slide_from_right',
          }}
        />
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
