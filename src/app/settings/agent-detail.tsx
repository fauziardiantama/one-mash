import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import AgentWorkspaceFilesCard from '../../components/settings/AgentWorkspaceFilesCard';
import AgentAvatar from '../../components/ui/AgentAvatar';
import AppButton from '../../components/ui/AppButton';
import ErrorMessage from '../../components/ui/ErrorMessage';
import FloatingHeader from '../../components/ui/FloatingHeader';
import ScreenShell from '../../components/ui/ScreenShell';
import { useStore } from '../../store';
import { COLORS, FONTS, LAYOUT, RADII, SPACING } from '../../theme';

function formatDate(ts?: number | null): string {
  if (!ts) return '-';
  try {
    return new Date(ts).toLocaleString('id-ID');
  } catch {
    return String(ts);
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>
        {value && value.trim() ? value : '-'}
      </Text>
    </View>
  );
}

export default function AgentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ agentId?: string }>();
  const agentId = (typeof params.agentId === 'string' && params.agentId.trim()) || 'main';

  const [headerHeight, setHeaderHeight] = useState<number>(LAYOUT.headerDefaultHeight);
  const [selectedFile, setSelectedFile] = useState<string>('IDENTITY.md');

  const detail = useStore((s) => s.agents.details[agentId]);
  const summaryFromList = useStore((s) => s.agents.list.find((a) => a.id === agentId));
  const detailLoading = useStore((s) => s.agents.detailLoading);
  const fileLoading = useStore((s) => s.agents.fileLoading);
  const uploading = useStore((s) => s.agents.uploading);
  const error = useStore((s) => s.agents.error);
  const loadAgentDetail = useStore((s) => s.agents.loadAgentDetail);
  const loadAgentFile = useStore((s) => s.agents.loadAgentFile);
  const selectAgent = useStore((s) => s.agents.selectAgent);
  const uploadAvatar = useStore((s) => s.agents.uploadAvatar);
  const removeAvatar = useStore((s) => s.agents.removeAvatar);
  const removeCharacter = useStore((s) => s.agents.removeCharacter);

  useEffect(() => {
    loadAgentDetail(agentId)
      .then((res) => {
        if (res.files.length > 0 && !res.files.some((f) => f.name === selectedFile)) {
          setSelectedFile(res.files[0].name);
        }
      })
      .catch(() => {});
  }, [agentId, loadAgentDetail]);

  const summary = detail?.summary ?? summaryFromList;
  const displayName = summary?.name || agentId;
  const isCharacter = Boolean(summary?.isCharacter || detail?.characterMeta);

  const handleSelectFile = (name: string) => {
    setSelectedFile(name);
    const existing = detail?.files.find((f) => f.name === name);
    if (existing && existing.content === undefined && !existing.missing) {
      loadAgentFile(agentId, name).catch(() => {});
    }
  };

  const handlePickAvatar = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      await uploadAvatar(agentId, {
        uri: asset.uri,
        name: asset.fileName || `${agentId}-avatar.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
      });
      await loadAgentDetail(agentId);
    } catch (err: unknown) {
      Alert.alert('Gagal Unggah Avatar', err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteAvatar = () => {
    Alert.alert('Hapus Avatar', `Hapus foto profil agen "${displayName}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          removeAvatar(agentId)
            .then(() => loadAgentDetail(agentId))
            .catch((e) => Alert.alert('Gagal', e instanceof Error ? e.message : String(e)));
        },
      },
    ]);
  };

  const handleDeleteCharacter = () => {
    Alert.alert('Hapus Karakter', `Hapus karakter "${displayName}" (@${agentId})?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          removeCharacter(agentId)
            .then(() => router.back())
            .catch((e) => Alert.alert('Gagal', e instanceof Error ? e.message : String(e)));
        },
      },
    ]);
  };

  return (
    <ScreenShell>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
        <View style={styles.heroCard}>
          <AgentAvatar agentId={agentId} name={displayName} size={72} />
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroId}>
            @{agentId} · {isCharacter ? 'Character v2' : agentId === 'main' ? 'Main Agent' : 'OpenClaw Agent'}
          </Text>
          <View style={styles.heroBtns}>
            <AppButton
              label="Mulai Chat"
              variant="magenta"
              onPress={() => {
                selectAgent(agentId);
                router.replace('/chat');
              }}
              style={styles.flexBtn}
            />
            <AppButton
              label="Ubah Avatar"
              variant="secondary"
              loading={uploading}
              onPress={handlePickAvatar}
              style={styles.flexBtn}
            />
          </View>
        </View>

        <ErrorMessage message={error} />
        {detailLoading && !detail ? (
          <ActivityIndicator color={COLORS.brandPinkSoft} style={styles.loader} />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>KONFIGURASI & MODEL OPENCLAW</Text>
          <InfoRow label="Primary Model" value={summary?.modelPrimary} />
          <InfoRow
            label="Fallback Models"
            value={summary?.modelFallbacks?.length ? summary.modelFallbacks.join(', ') : '-'}
          />
          <InfoRow label="Identity Name" value={summary?.identityName} />
          <InfoRow label="Thinking Default" value={summary?.thinkingDefault} />
          <InfoRow label="Permission Mode" value={summary?.defaultPermissionMode} />
          <InfoRow label="Runtime" value={summary?.runtimeId} />
          <InfoRow label="Workspace" value={summary?.workspace} />
          <InfoRow label="Created Via" value={summary?.createdVia} />
          <InfoRow label="Dibuat" value={formatDate(summary?.createdAt)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>TOOLS & SUBAGENTS POLICY</Text>
          <InfoRow
            label="Tools Allow"
            value={detail?.toolsAllow.length ? detail.toolsAllow.join(', ') : '(Tidak ada / diblokir)'}
          />
          <InfoRow
            label="Tools Deny"
            value={detail?.toolsDeny.length ? detail.toolsDeny.join(', ') : '(Kosong)'}
          />
          <InfoRow
            label="Subagents Allow"
            value={detail?.subagentsAllow.length ? detail.subagentsAllow.join(', ') : '(Kosong)'}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>DATA BACKEND (AVATAR & KARAKTER)</Text>
          <InfoRow
            label="Foto Profil"
            value={
              detail?.profilePicMeta
                ? `${detail.profilePicMeta.mimeType} (${detail.profilePicMeta.sizeBytes ?? '-'} bytes)`
                : 'Belum diunggah'
            }
          />
          {detail?.profilePicMeta?.sha256 ? (
            <InfoRow label="Avatar SHA256" value={detail.profilePicMeta.sha256} />
          ) : null}
          {detail?.characterMeta ? (
            <>
              <InfoRow label="Spec Kartu" value={detail.characterMeta.spec || 'chara_card_v2'} />
              <InfoRow label="Creator" value={detail.characterMeta.creator} />
              <InfoRow label="Versi Kartu" value={detail.characterMeta.characterVersion} />
              <InfoRow label="Card SHA256" value={detail.characterMeta.cardSha256} />
              <InfoRow label="Diimpor" value={formatDate(detail.characterMeta.createdAt)} />
            </>
          ) : null}
          {detail?.profilePicMeta ? (
            <AppButton
              label="Hapus Foto Profil"
              variant="secondary"
              loading={uploading}
              onPress={handleDeleteAvatar}
              style={styles.actionGap}
            />
          ) : null}
          {isCharacter && agentId !== 'main' ? (
            <AppButton
              label="Hapus Agen Karakter"
              variant="danger"
              onPress={handleDeleteCharacter}
              style={styles.actionGap}
            />
          ) : null}
        </View>

        <AgentWorkspaceFilesCard
          files={detail?.files ?? []}
          selectedName={selectedFile}
          fileLoading={fileLoading}
          onSelectFile={handleSelectFile}
        />
      </ScrollView>

      <FloatingHeader
        title="Detail Agen"
        onLeftPress={() => router.back()}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  heroCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  heroName: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.bold, marginTop: SPACING.md },
  heroId: { color: COLORS.brandPinkSoft, fontSize: 13, fontFamily: FONTS.medium, marginTop: 4 },
  heroBtns: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, width: '100%' },
  flexBtn: { flex: 1 },
  loader: { marginBottom: SPACING.lg },
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    color: COLORS.brandPinkSoft,
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  infoRow: {
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  infoLabel: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONTS.medium },
  infoValue: { color: COLORS.textPrimary, fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
  actionGap: { marginTop: SPACING.md },
});
