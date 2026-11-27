import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../components/ui/AppButton';
import AppInput from '../components/ui/AppInput';
import ErrorMessage from '../components/ui/ErrorMessage';
import KeyboardScrollView from '../components/ui/KeyboardScrollView';
import ScreenShell from '../components/ui/ScreenShell';
import { useStore } from '../store';
import { COLORS, FONTS, SPACING } from '../theme';

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const storedUrl = useStore((s) => s.connection.baseUrl);
  const loading = useStore((s) => s.connection.loading);
  const storeError = useStore((s) => s.connection.error);
  const clearError = useStore((s) => s.connection.clearError);
  const connectToBackend = useStore((s) => s.connection.connectToBackend);

  const [serverUrl, setServerUrl] = useState(storedUrl || 'http://10.0.2.2:4001');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async () => {
    setLocalError('');
    clearError();
    const trimmed = serverUrl.trim().replace(/\/+$/, '');
    if (!trimmed) {
      setLocalError('Backend Base URL tidak boleh kosong.');
      return;
    }
    const ok = await connectToBackend(trimmed);
    if (ok) {
      router.replace('/chat');
    }
  };

  return (
    <ScreenShell>
      <KeyboardScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + SPACING.xxl }]}>
        <Text style={styles.title}>O.N.E Mash</Text>
        <Text style={styles.subtitle}>
          Hubungkan aplikasi ke server backend OpenClaw Network Ecosystem.
        </Text>

        <AppInput
          label="Backend Base URL"
          value={serverUrl}
          onChangeText={(val) => {
            setLocalError('');
            clearError();
            setServerUrl(val);
          }}
          placeholder="http://192.168.1.x:4001"
          hint="Otomatis memvalidasi /health dan menyinkronkan konfigurasi OpenClaw."
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <ErrorMessage message={localError || storeError} />

        <AppButton
          label="Hubungkan"
          loading={loading}
          onPress={handleSubmit}
          style={styles.submitBtn}
        />
      </KeyboardScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: SPACING.xxl,
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
});
