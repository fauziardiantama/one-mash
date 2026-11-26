import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AgentConfigEditCard from '../../components/settings/AgentConfigEditCard';
import AgentMetaSessionsCard from '../../components/settings/AgentMetaSessionsCard';
import AgentSkillsCard from '../../components/settings/AgentSkillsCard';
import AgentToolsCard from '../../components/settings/AgentToolsCard';
import AgentWorkspaceFilesCard from '../../components/settings/AgentWorkspaceFilesCard';
import AgentAvatar from '../../components/ui/AgentAvatar';
import AppButton from '../../components/ui/AppButton';
import ErrorMessage from '../../components/ui/ErrorMessage';
import FloatingHeader from '../../components/ui/FloatingHeader';
import ScreenShell from '../../components/ui/ScreenShell';
import { useStore } from '../../store';
import { COLORS, FONTS, LAYOUT, RADII, SPACING } from '../../theme';

type DetailTab = 'config' | 'tools' | 'skills' | 'docs' | 'meta';

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'config', label: 'Config' },
  { id: 'tools', label: 'Tools' },
  { id: 'skills', label: 'Skills' },
  { id: 'docs', label: 'Dokumen' },
  { id: 'meta', label: 'Sesi' },
];

export default function AgentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ agentId?: string }>();
  const agentId = (typeof params.agentId === 'string' && params.agentId.trim()) || 'main';

  const [headerHeight, setHeaderHeight] = useState<number>(LAYOUT.headerDefaultHeight);
  const [selectedTab, setSelectedTab] = useState<DetailTab>('config');
  const [selectedFile, setSelectedFile] = useState<string>('IDENTITY.md');

  const detail = useStore((s) => s.agents.details[agentId]);
  const allAgents = useStore((s) => s.agents.list);
  const models = useStore((s) => s.agents.models);
  const summaryFromList = allAgents.find((a) => a.id === agentId);
  const detailLoading = useStore((s) => s.agents.detailLoading);
  const fileLoading = useStore((s) => s.agents.fileLoading);
  const savingConfig = useStore((s) => s.agents.savingConfig);
  const savingFile = useStore((s) => s.agents.savingFile);
  const uploading = useStore((s) => s.agents.uploading);
  const error = useStore((s) => s.agents.error);
  const loadModels = useStore((s) => s.agents.loadModels);
  const loadAgentDetail = useStore((s) => s.agents.loadAgentDetail);
  const loadAgentFile = useStore((s) => s.agents.loadAgentFile);
  const saveAgentFile = useStore((s) => s.agents.saveAgentFile);
  const updateAgentConfig = useStore((s) => s.agents.updateAgentConfig);
  const updateAgentToolsPolicy = useStore((s) => s.agents.updateAgentToolsPolicy);
  const updateAgentSkillsFilter = useStore((s) => s.agents.updateAgentSkillsFilter);
  const deleteAgent = useStore((s) => s.agents.deleteAgent);
  const selectAgent = useStore((s) => s.agents.selectAgent);
  const openDirectChat = useStore((s) => s.chat.openDirectChat);
  const uploadAvatar = useStore((s) => s.agents.uploadAvatar);
  const removeAvatar = useStore((s) => s.agents.removeAvatar);

  useEffect(() => {
    loadModels().catch(() => {});
    loadAgentDetail(agentId)
      .then((res) => {
        if (res.files.length > 0 && !res.files.some((f) => f.name === selectedFile)) {
          setSelectedFile(res.files[0].name);
        }
      })
      .catch(() => {});
  }, [agentId, loadAgentDetail, loadModels]);

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

  const handleDeleteAgent = () => {
    Alert.alert('Hapus Agen', `Hapus agen "${displayName}" (@${agentId}) beserta filenya?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          deleteAgent(agentId)
            .then(() => router.back())
            .catch((e) => Alert.alert('Gagal', e instanceof Error ? e.message : String(e)));
        },
      },
    ]);
  };

  const notifySaved = (title: string) => Alert.alert(title, 'Perubahan berhasil disimpan ke OpenClaw.');

  return (
    <ScreenShell>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <AgentAvatar agentId={agentId} name={displayName} size={72} />
          <Text style={styles.heroName}>
            {summary?.emoji ? `${summary.emoji} ` : ''}
            {displayName}
          </Text>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {TABS.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.75}
                style={[styles.tabPill, active && styles.tabPillActive]}
                onPress={() => setSelectedTab(tab.id)}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ErrorMessage message={error} />
        {detailLoading && !detail ? <ActivityIndicator color={COLORS.brandPinkSoft} style={styles.loader} /> : null}

        {selectedTab === 'config' ? (
          <AgentConfigEditCard
            agentId={agentId}
            detail={detail}
            summary={summary}
            models={models}
            allAgents={allAgents}
            saving={savingConfig}
            onSave={async (patch) => {
              try {
                await updateAgentConfig(agentId, patch);
                notifySaved('Konfigurasi Disimpan');
              } catch (e) {
                Alert.alert('Gagal Menyimpan', e instanceof Error ? e.message : String(e));
              }
            }}
          />
        ) : null}

        {selectedTab === 'tools' ? (
          <AgentToolsCard
            profile={detail?.toolsProfile}
            allow={detail?.toolsAllow ?? null}
            alsoAllow={detail?.toolsAlsoAllow ?? []}
            deny={detail?.toolsDeny ?? []}
            effectiveTools={detail?.effectiveTools ?? null}
            catalog={detail?.toolsCatalog ?? null}
            saving={savingConfig}
            onSave={async (policy) => {
              try {
                await updateAgentToolsPolicy(agentId, policy);
                notifySaved('Tools Disimpan');
              } catch (e) {
                Alert.alert('Gagal Menyimpan Tools', e instanceof Error ? e.message : String(e));
              }
            }}
          />
        ) : null}

        {selectedTab === 'skills' ? (
          <AgentSkillsCard
            skills={detail?.skills ?? []}
            skillsFilter={detail?.skillsFilter ?? null}
            saving={savingConfig}
            onSaveFilter={async (nextFilter) => {
              try {
                await updateAgentSkillsFilter(agentId, nextFilter);
                notifySaved('Filter Skills Disimpan');
              } catch (e) {
                Alert.alert('Gagal Menyimpan Skills', e instanceof Error ? e.message : String(e));
              }
            }}
          />
        ) : null}

        {selectedTab === 'docs' ? (
          <AgentWorkspaceFilesCard
            files={detail?.files ?? []}
            selectedName={selectedFile}
            fileLoading={fileLoading}
            savingFile={savingFile}
            onSelectFile={handleSelectFile}
            onSaveFile={async (name, content) => {
              await saveAgentFile(agentId, name, content);
              notifySaved(`${name} Disimpan`);
            }}
          />
        ) : null}

        {selectedTab === 'meta' ? (
          <AgentMetaSessionsCard
            agentId={agentId}
            detail={detail}
            uploading={uploading}
            onOpenSession={(sessionKey) => {
              openDirectChat(agentId, sessionKey).catch(() => {});
              router.replace('/chat');
            }}
            onDeleteAvatar={handleDeleteAvatar}
            onDeleteAgent={handleDeleteAgent}
          />
        ) : null}
      </ScrollView>

      <FloatingHeader
        title="Detail & Edit Agen"
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
    marginBottom: SPACING.md,
  },
  heroName: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.bold, marginTop: SPACING.md },
  heroId: { color: COLORS.brandPinkSoft, fontSize: 13, fontFamily: FONTS.medium, marginTop: 4 },
  heroBtns: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, width: '100%' },
  flexBtn: { flex: 1 },
  tabsRow: { flexGrow: 0, marginBottom: SPACING.md },
  tabPill: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabPillActive: { backgroundColor: COLORS.surfaceControl, borderColor: COLORS.brandPinkSoft },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.medium },
  tabTextActive: { color: COLORS.textPrimary, fontFamily: FONTS.bold },
  loader: { marginBottom: SPACING.lg },
});
