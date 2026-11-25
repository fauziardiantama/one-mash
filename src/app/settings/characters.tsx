import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ParsedCardPreview } from '../../api';
import AgentAvatar from '../../components/ui/AgentAvatar';
import AppButton from '../../components/ui/AppButton';
import FloatingHeader from '../../components/ui/FloatingHeader';
import Icon from '../../components/ui/Icon';
import InTreeBottomSheet from '../../components/ui/InTreeBottomSheet';
import ScreenShell from '../../components/ui/ScreenShell';
import { useStore } from '../../store';
import { COLORS, FONTS, LAYOUT, RADII, SPACING } from '../../theme';

export default function CharactersSettingsScreen() {
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState<number>(LAYOUT.headerDefaultHeight);
  const [pickedFile, setPickedFile] = useState<{ uri: string; name?: string; mimeType?: string } | null>(null);
  const [preview, setPreview] = useState<ParsedCardPreview | null>(null);

  const characters = useStore((s) => s.agents.characters);
  const uploading = useStore((s) => s.agents.uploading);
  const loadAgents = useStore((s) => s.agents.loadAgents);
  const selectAgent = useStore((s) => s.agents.selectAgent);
  const parseCard = useStore((s) => s.agents.parseCard);
  const importCard = useStore((s) => s.agents.importCard);
  const removeCharacter = useStore((s) => s.agents.removeCharacter);

  useEffect(() => {
    loadAgents().catch(() => {});
  }, [loadAgents]);

  const handlePickCard = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'application/json'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.name || 'character.png',
        mimeType: asset.mimeType || (asset.name?.endsWith('.json') ? 'application/json' : 'image/png'),
      };
      const parsed = await parseCard(file);
      setPickedFile(file);
      setPreview(parsed);
    } catch (err: unknown) {
      Alert.alert('Gagal Membaca Kartu', err instanceof Error ? err.message : String(err));
    }
  };

  const handleConfirmImport = async () => {
    if (!pickedFile) return;
    try {
      const agentId = await importCard(pickedFile);
      setPreview(null);
      setPickedFile(null);
      selectAgent(agentId);
      router.replace('/chat');
    } catch (err: unknown) {
      Alert.alert('Impor Gagal', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <ScreenShell>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
        <AppButton
          label="Impor Character Card v2 (.png / .json)"
          variant="magenta"
          loading={uploading}
          onPress={handlePickCard}
          style={styles.importBtn}
        />

        {characters.length === 0 ? (
          <Text style={styles.empty}>Belum ada karakter v2 yang diimpor.</Text>
        ) : (
          characters.map((ch) => (
            <View key={ch.agentId} style={styles.card}>
              <AgentAvatar agentId={ch.agentId} name={ch.characterName} size={48} />
              <View style={styles.infoCol}>
                <Text style={styles.name}>{ch.characterName}</Text>
                <Text style={styles.meta}>@{ch.agentId} • Tanpa Tools</Text>
              </View>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  selectAgent(ch.agentId);
                  router.replace('/chat');
                }}>
                <Icon name="message-circle" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => removeCharacter(ch.agentId).catch(() => {})}>
                <Icon name="trash-2" size={18} color={COLORS.statusDangerAlt} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <FloatingHeader
        title="Karakter & Kartu v2"
        onLeftPress={() => router.back()}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />

      <InTreeBottomSheet visible={Boolean(preview)} onClose={() => setPreview(null)}>
        {preview ? (
          <View>
            <Text style={styles.sheetTitle}>{preview.name}</Text>
            <Text style={styles.sheetSub}>Agent baru akan dibuat tanpa akses tools + anti-duplikat.</Text>
            {preview.description ? (
              <Text style={styles.sheetDesc} numberOfLines={6}>
                {preview.description}
              </Text>
            ) : null}
            <AppButton
              label="Buat Agen Karakter"
              variant="magenta"
              loading={uploading}
              onPress={handleConfirmImport}
            />
          </View>
        ) : null}
      </InTreeBottomSheet>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  importBtn: { marginBottom: SPACING.lg },
  empty: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', marginTop: SPACING.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoCol: { flex: 1, marginLeft: SPACING.md },
  name: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.bold },
  meta: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  iconBtn: { padding: SPACING.sm },
  sheetTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.bold, marginBottom: 4 },
  sheetSub: { color: COLORS.brandPinkSoft, fontSize: 12, fontFamily: FONTS.medium, marginBottom: SPACING.md },
  sheetDesc: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.regular, lineHeight: 20, marginBottom: SPACING.lg },
});
