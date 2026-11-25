import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../../store';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';

interface SessionHistoryTabContentProps {
  onSelectSession: (agentId: string, sessionKey: string) => void;
}

export default function SessionHistoryTabContent({ onSelectSession }: SessionHistoryTabContentProps) {
  const activeAgentId = useStore((s) => s.agents.activeAgentId);
  const sessions = useStore((s) => s.chat.sessions);
  const activeSessionKey = useStore((s) => s.chat.activeSessionKey);

  const agentSessions = sessions.filter((s) => s.agentId === activeAgentId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {agentSessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Riwayat</Text>
          <Text style={styles.emptySub}>Belum ada sesi tersimpan untuk agen ini.</Text>
        </View>
      ) : (
        agentSessions.map((sess) => {
          const active = sess.key === activeSessionKey;
          return (
            <TouchableOpacity
              key={sess.key}
              activeOpacity={0.75}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => onSelectSession(sess.agentId, sess.key)}>
              <Text style={styles.title} numberOfLines={1}>
                {sess.title}
              </Text>
              <Text style={styles.keyText} numberOfLines={1}>
                {sess.key}
              </Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingBottom: 60 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 17, fontFamily: FONTS.bold, marginBottom: 6 },
  emptySub: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular },
  row: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rowActive: {
    borderWidth: 1,
    borderColor: COLORS.brandMagenta,
  },
  title: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.bold },
  keyText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.mono, marginTop: 2 },
});
