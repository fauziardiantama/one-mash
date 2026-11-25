import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import ErrorMessage from '../../components/ui/ErrorMessage';
import FloatingHeader from '../../components/ui/FloatingHeader';
import ScreenShell from '../../components/ui/ScreenShell';
import { useStore } from '../../store';
import { COLORS, FONTS, LAYOUT, RADII, SPACING } from '../../theme';

export default function ConnectionSettingsScreen() {
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState<number>(LAYOUT.headerDefaultHeight);

  const baseUrl = useStore((s) => s.connection.baseUrl);
  const connected = useStore((s) => s.connection.connected);
  const bootstrapStatus = useStore((s) => s.connection.bootstrapStatus);
  const loading = useStore((s) => s.connection.loading);
  const bootstrapLoading = useStore((s) => s.connection.bootstrapLoading);
  const error = useStore((s) => s.connection.error);
  const connectToBackend = useStore((s) => s.connection.connectToBackend);
  const refreshBootstrap = useStore((s) => s.connection.refreshBootstrap);
  const triggerBootstrap = useStore((s) => s.connection.triggerBootstrap);
  const disconnect = useStore((s) => s.connection.disconnect);

  const [urlInput, setUrlInput] = useState(baseUrl);

  useEffect(() => {
    refreshBootstrap().catch(() => {});
  }, [refreshBootstrap]);

  const handleSaveUrl = async () => {
    const ok = await connectToBackend(urlInput);
    if (ok) {
      Alert.alert('Terhubung', 'Backend dan OpenClaw berhasil diverifikasi.');
    }
  };

  const isMainAgentReady =
    bootstrapStatus?.details?.mainAgentConfigured ?? bootstrapStatus?.mainAgentConfigured;

  return (
    <ScreenShell>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend Endpoint</Text>
          <Text style={styles.statusText}>
            Status: {connected ? 'Terhubung' : 'Terputus'}
          </Text>
          <AppInput
            label="Backend Base URL"
            variant="card"
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <ErrorMessage message={error} />
          <AppButton label="Simpan & Uji Koneksi" loading={loading} onPress={handleSaveUrl} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>OpenClaw Auto-Bootstrap</Text>
          <Text style={styles.statusText}>
            Konfigurasi Gateway: {bootstrapStatus?.configured ? 'Siap' : 'Belum terpasang'}
          </Text>
          <Text style={styles.statusText}>
            Main Agent: {isMainAgentReady ? 'Aktif (LiteLLM)' : 'Perlu sinkronisasi'}
          </Text>
          <AppButton
            label="Jalankan Bootstrap OpenClaw"
            variant="secondary"
            loading={bootstrapLoading}
            onPress={() =>
              triggerBootstrap(true)
                .then(() => Alert.alert('Selesai', 'OpenClaw berhasil disinkronkan dengan LiteLLM.'))
                .catch((e) => Alert.alert('Gagal', String(e?.message || e)))
            }
            style={styles.topGap}
          />
        </View>

        <AppButton
          label="Putuskan Koneksi"
          variant="danger"
          onPress={() => {
            disconnect();
            router.replace('/connect');
          }}
        />
      </ScrollView>

      <FloatingHeader
        title="Konektor & Gateway"
        onLeftPress={() => router.back()}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.bold, marginBottom: SPACING.sm },
  statusText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.regular, marginBottom: 6 },
  topGap: { marginTop: SPACING.md },
});
