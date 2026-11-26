import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const agentsList = useStore((s) => s.agents.list);
  const loading = useStore((s) => s.agents.loading);
  const uploading = useStore((s) => s.agents.uploading);
  const loadAgents = useStore((s) => s.agents.loadAgents);
  const selectAgent = useStore((s) => s.agents.selectAgent);
  const parseCard = useStore((s) => s.agents.parseCard);
  const importCard = useStore((s) => s.agents.importCard);
  const removeCharacter = useStore((s) => s.agents.removeCharacter);

  useEffect(() => {
    loadAgents().catch(() => {});
  }, [loadAgents]);

  const sortedAgents = useMemo(() => {
    return [...agentsList].sort((a, b) => {
      if (a.id === 'main') return -1;
      if (b.id === 'main') return 1;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0) || a.name.localeCompare(b.name);
    });
  }, [agentsList]);

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

  const handleConfirmDelete = (agentId: string, name: string) => {
    Alert.alert('Hapus Karakter', `Hapus agen karakter "${name}" (@${agentId}) beserta filenya?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          removeCharacter(agentId).catch((err) => {
            Alert.alert('Gagal Menghapus', err instanceof Error ? err.message : String(err));
          });
        },
      },
    ]);
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

        <Text style={styles.sectionLabel}>SEMUA AGEN OPENCLAW ({sortedAgents.length})</Text>

        {loading && sortedAgents.length === 0 ? (
          <ActivityIndicator color={COLORS.brandPinkSoft} style={styles.loader} />
        ) : sortedAgents.length === 0 ? (
          <Text style={styles.empty}>Belum ada agen OpenClaw terdaftar.</Text>
        ) : (
          sortedAgents.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              activeOpacity={0.78}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/settings/agent-detail',
                  params: { agentId: agent.id },
                })
              }>
              <AgentAvatar agentId={agent.id} name={agent.name} size={48} />
              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {agent.name}
                  </Text>
                  {agent.isCharacter ? (
                    <View style={styles.charBadge}>
                      <Text style={styles.charBadgeText}>Character v2</Text>
                    </View>
                  ) : agent.id === 'main' ? (
                    <View style={styles.coreBadge}>
                      <Text style={styles.coreBadgeText}>Main</Text>
                    </View>
                  ) : (
                    <View style={styles.openclawBadge}>
                      <Text style={styles.openclawBadgeText}>OpenClaw</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  @{agent.id} · {agent.modelPrimary || 'default model'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  selectAgent(agent.id);
                  router.replace('/chat');
                }}>
                <Icon name="message-circle" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
              {agent.isCharacter && agent.id !== 'main' ? (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleConfirmDelete(agent.id, agent.name)}>
                  <Icon name="trash-2" size={18} color={COLORS.statusDangerAlt} />
                </TouchableOpacity>
              ) : (
                <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <FloatingHeader
        title="Agents & Characters"
        onLeftPress={() => router.back()}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />

      <InTreeBottomSheet visible={Boolean(preview)} onClose={() => setPreview(null)}>
        {preview ? (
          <View>
            <Text style={styles.sheetTitle}>{preview.name}</Text>
            <Text style={styles.sheetSub}>
              @{preview.agentId || 'auto'} · Tools diblokir + anti-duplikat
              {preview.creator ? ` · Oleh ${preview.creator}` : ''}
            </Text>
            {preview.duplicate?.isDuplicate ? (
              <View style={styles.dupBox}>
                <Text style={styles.dupText}>
                  {preview.duplicate.reason || 'Kartu karakter ini terdeteksi duplikat dan tidak bisa diimpor.'}
                </Text>
              </View>
            ) : null}
            {preview.description ? (
              <Text style={styles.sheetDesc} numberOfLines={6}>
                {preview.description}
              </Text>
            ) : null}
            <AppButton
              label={preview.duplicate?.isDuplicate ? 'Sudah Terdaftar' : 'Buat Agen Karakter'}
              variant="magenta"
              loading={uploading}
              disabled={Boolean(preview.duplicate?.isDuplicate)}
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
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  loader: { marginTop: SPACING.xxl },
  empty: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', marginTop: SPACING.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoCol: { flex: 1, marginLeft: SPACING.md, marginRight: SPACING.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.xs },
  name: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.bold, flexShrink: 1 },
  charBadge: {
    backgroundColor: COLORS.statusPurpleBg,
    borderRadius: RADII.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  charBadgeText: { color: COLORS.statusPurple, fontSize: 10, fontFamily: FONTS.bold },
  coreBadge: {
    backgroundColor: COLORS.statusInfoBg,
    borderRadius: RADII.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coreBadgeText: { color: COLORS.statusInfo, fontSize: 10, fontFamily: FONTS.bold },
  openclawBadge: {
    backgroundColor: COLORS.surfaceBadgeSlate,
    borderRadius: RADII.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  openclawBadgeText: { color: COLORS.textSoft, fontSize: 10, fontFamily: FONTS.bold },
  meta: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.regular, marginTop: 4 },
  iconBtn: { padding: SPACING.sm },
  sheetTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.bold, marginBottom: 4 },
  sheetSub: { color: COLORS.brandPinkSoft, fontSize: 12, fontFamily: FONTS.medium, marginBottom: SPACING.md },
  dupBox: {
    backgroundColor: COLORS.statusDangerBg,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dupText: { color: COLORS.statusDanger, fontSize: 12, fontFamily: FONTS.medium },
  sheetDesc: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.regular, lineHeight: 20, marginBottom: SPACING.lg },
});
