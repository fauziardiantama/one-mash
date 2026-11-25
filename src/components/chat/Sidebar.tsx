import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { COLORS, FONTS, LAYOUT, RADII, SPACING } from '../../theme';
import AgentAvatar from '../ui/AgentAvatar';
import Icon, { type IconName } from '../ui/Icon';
import TopFade from '../ui/TopFade';

export const SIDEBAR_WIDTH = Math.round(Dimensions.get('window').width * LAYOUT.sidebarWidthRatio);

const MUSE_TABS: Array<{ icon: IconName; label: string }> = [
  { icon: 'message-circle', label: 'Obrolan utama' },
  { icon: 'file-text', label: 'Kabar' },
  { icon: 'zap', label: 'Ide' },
  { icon: 'check-square', label: 'Sasaran' },
  { icon: 'grid', label: 'Perpustakaan' },
];

interface SidebarProps {
  onSettingsPress: () => void;
  onSelectChat: () => void;
}

const MAIN_CHAT_KEY = 'agent:main:main-chat';

function extractSessionSuffix(key: string): string {
  const trimmed = key.trim();
  if (!trimmed.toLowerCase().startsWith('agent:')) return trimmed;
  const parts = trimmed.split(':');
  return parts.length >= 3 ? parts.slice(2).join(':') : trimmed;
}

function isReservedOrGroupSession(key: string): boolean {
  const suffix = extractSessionSuffix(key).toLowerCase();
  return (
    suffix === 'main-chat' ||
    suffix === 'main' ||
    suffix === 'notification-history' ||
    suffix === 'notifications' ||
    suffix.startsWith('group-') ||
    suffix.startsWith('group:')
  );
}

export default function Sidebar({ onSettingsPress, onSelectChat }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const [collapsed, setCollapsed] = useState(false);
  const [tabCollapsed, setTabCollapsed] = useState(false);
  const [groupsCollapsed, setGroupsCollapsed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const activeAgentId = useStore((s) => s.agents.activeAgentId);
  const agentsList = useStore((s) => s.agents.list);
  const groupsList = useStore((s) => s.groups.list);
  const mode = useStore((s) => s.chat.mode);
  const activeGroupId = useStore((s) => s.chat.activeGroupId);
  const activeSessionKey = useStore((s) => s.chat.activeSessionKey);
  const sessions = useStore((s) => s.chat.sessions);
  const loadSessions = useStore((s) => s.chat.loadSessions);
  const openDirectChat = useStore((s) => s.chat.openDirectChat);
  const openGroupChat = useStore((s) => s.chat.openGroupChat);
  const newDirectSession = useStore((s) => s.chat.newDirectSession);

  useEffect(() => {
    loadSessions().catch(() => {});
  }, [loadSessions]);

  const activeAgent = agentsList.find((a) => a.id === activeAgentId);
  const agentNameById = new Map(agentsList.map((a) => [a.id, a.name]));
  const displayName = activeAgent?.name || activeAgentId || 'Main Agent';

  const normalizedQuery = query.trim().toLowerCase();
  const sideSessions = sessions.filter((s) => {
    if (isReservedOrGroupSession(s.key)) return false;
    if (!normalizedQuery) return true;
    return s.title.toLowerCase().includes(normalizedQuery) || s.agentId.toLowerCase().includes(normalizedQuery);
  });

  const isMainSelected = mode === 'direct' && activeSessionKey === MAIN_CHAT_KEY;

  return (
    <View style={styles.sidebar}>
      <View style={[styles.inner, { paddingBottom: SPACING.xxl + insets.bottom }]}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + SPACING.md }]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{displayName}</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.tabHeader}
            onPress={() => setTabCollapsed((v) => !v)}>
            <Text style={styles.sectionTitle}>TAB</Text>
          </TouchableOpacity>
          {!tabCollapsed && (
            <>
              <Text style={styles.hint}>Anda bisa mengurutkan ulang dengan menekan lama</Text>
              {MUSE_TABS.map((tab) => {
                const isMainTab = tab.label === 'Obrolan utama';
                const selected = isMainTab && isMainSelected;
                return (
                  <TouchableOpacity
                    key={tab.label}
                    activeOpacity={0.7}
                    style={[styles.tabRow, selected && styles.tabRowActive]}
                    onPress={() => {
                      if (isMainTab) {
                        openDirectChat('main', MAIN_CHAT_KEY);
                        onSelectChat();
                      }
                    }}>
                    <Icon
                      name={tab.icon}
                      size={20}
                      color={selected ? COLORS.textPrimary : COLORS.textMuted}
                      style={styles.tabIcon}
                    />
                    <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.sideHeader}
            onPress={() => setGroupsCollapsed((v) => !v)}>
            <Text style={styles.sectionTitle}>GRUP</Text>
            <Icon name="layers" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {!groupsCollapsed &&
            (groupsList.length === 0 ? (
              <Text style={styles.emptyText}>Belum ada grup.</Text>
            ) : (
              <View style={styles.sideList}>
                {groupsList.map((grp) => {
                  const selected = mode === 'group' && activeGroupId === grp.id;
                  return (
                    <TouchableOpacity
                      key={grp.id}
                      activeOpacity={0.7}
                      style={[styles.agentRow, selected && styles.sessionRowActive]}
                      onPress={() => {
                        openGroupChat(grp.id);
                        onSelectChat();
                      }}>
                      <Icon name="layers" size={18} color={COLORS.brandPinkSoft} style={styles.tabIcon} />
                      <Text style={styles.agentLabel} numberOfLines={1}>
                        {grp.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.sideHeader}
            onPress={() => setCollapsed((v) => !v)}>
            <Text style={styles.sectionTitle}>RIWAYAT SESI</Text>
            <Icon name="archive" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {!collapsed &&
            (sideSessions.length === 0 ? (
              <Text style={styles.emptyText}>Akan muncul di sini jika Anda memulai.</Text>
            ) : (
              <View style={styles.sideList}>
                {sideSessions.map((session) => {
                  const isSelected = mode === 'direct' && activeSessionKey === session.key;
                  const agentLabel = agentNameById.get(session.agentId) || session.agentId;
                  return (
                    <TouchableOpacity
                      key={session.key}
                      activeOpacity={0.7}
                      style={[styles.sessionRow, isSelected && styles.sessionRowActive]}
                      onPress={() => {
                        openDirectChat(session.agentId, session.key);
                        onSelectChat();
                      }}>
                      <AgentAvatar agentId={session.agentId} name={agentLabel} size={24} />
                      <View style={styles.sessionTextWrap}>
                        <Text style={styles.sessionLabel} numberOfLines={1}>
                          {session.title}
                        </Text>
                        <Text style={styles.sessionAgentMeta} numberOfLines={1}>
                          {agentLabel}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
        </ScrollView>

        <TopFade height={Math.max(insets.top, SPACING.sm)} />

        {searching && (
          <View style={styles.searchBarRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Cari sesi..."
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setSearching(false);
              }}>
              <Icon name="x" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomBar}>
          <TouchableOpacity activeOpacity={0.7} style={styles.bottomCircle} onPress={onSettingsPress}>
            <Icon name="settings" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.searchPill}
            onPress={() => setSearching((v) => !v)}>
            <Icon name="search" size={18} color={COLORS.textPrimary} style={styles.searchIcon} />
            <Text style={styles.searchLabel}>Cari</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.bottomCircle}
            onPress={() => {
              newDirectSession();
              onSelectChat();
            }}>
            <Icon name="edit" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: COLORS.canvas,
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 0,
  },
  inner: { width: SIDEBAR_WIDTH, flex: 1, paddingHorizontal: SPACING.lg },
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },
  title: { color: COLORS.textPrimary, fontSize: 28, fontFamily: FONTS.bold, marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 1 },
  hint: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.regular, marginTop: 6, marginBottom: SPACING.md },
  tabRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: RADII.md },
  tabRowActive: { backgroundColor: COLORS.surfaceElevated },
  tabIcon: { marginRight: SPACING.md },
  tabLabel: { color: COLORS.textMuted, fontSize: 16, fontFamily: FONTS.regular },
  tabLabelActive: { color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.borderSubtle, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  sideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md },
  tabHeader: { paddingVertical: SPACING.xs },
  emptyText: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular, marginTop: SPACING.xs },
  sideList: { marginTop: SPACING.xs },
  agentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: SPACING.md, borderRadius: RADII.lg, marginBottom: 2 },
  agentLabel: { flex: 1, color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.medium, marginLeft: SPACING.md },
  sessionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, paddingHorizontal: 12, borderRadius: RADII.lg, marginBottom: 2 },
  sessionRowActive: { backgroundColor: COLORS.surfaceElevated },
  sessionTextWrap: { flex: 1, marginLeft: SPACING.md },
  sessionLabel: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.medium },
  sessionAgentMeta: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.regular, marginTop: 1 },
  searchBarRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceCard, borderRadius: RADII.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.sm },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.regular },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACING.sm },
  bottomCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  searchPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceElevated, borderRadius: RADII.xxl, paddingHorizontal: SPACING.xl, height: 48, flex: 1, marginHorizontal: SPACING.md },
  searchIcon: { marginRight: SPACING.sm },
  searchLabel: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.regular },
});
