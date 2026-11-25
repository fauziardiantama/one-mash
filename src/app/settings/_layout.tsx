import { Stack } from 'expo-router';
import { COLORS } from '../../theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.canvas },
        animation: 'slide_from_right',
      }}
    />
  );
}
