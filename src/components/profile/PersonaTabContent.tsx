import { StyleSheet, Text, View } from 'react-native';
import { useStore } from '../../store';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import Icon from '../ui/Icon';

export default function PersonaTabContent() {
  const activeAgentId = useStore((s) => s.agents.activeAgentId);
  const agentsList = useStore((s) => s.agents.list);
  const characters = useStore((s) => s.agents.characters);
  const activeSessionModel = useStore((s) => s.chat.activeSessionModel);
  const activeSessionModelOverridden = useStore((s) => s.chat.activeSessionModelOverridden);

  const activeAgent = agentsList.find((a) => a.id === activeAgentId);
  const char = characters.find((c) => c.agentId === activeAgentId);
  const activeModel = activeSessionModel || activeAgent?.modelPrimary || 'Belum terpasang';

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.label}>MODEL AGEN & SESI</Text>
        <Text style={styles.name}>{activeModel}</Text>
        <Text style={styles.meta}>
          Mode: {activeSessionModelOverridden ? 'Override khusus sesi aktif' : 'Default agen'}
        </Text>
        {activeAgent?.modelPrimary ? (
          <Text style={styles.desc}>Default Primary: {activeAgent.modelPrimary}</Text>
        ) : null}
        {activeAgent?.modelFallbacks?.length ? (
          <Text style={styles.desc}>Fallback: {activeAgent.modelFallbacks.join(', ')}</Text>
        ) : null}
      </View>

      {char ? (
        <View style={[styles.card, styles.cardGap]}>
          <Text style={styles.label}>CHARACTER CARD V2</Text>
          <Text style={styles.name}>{char.characterName}</Text>
          <Text style={styles.meta}>Agent ID: {char.agentId} · Tools: Locked (None)</Text>
          {char.description ? <Text style={styles.desc}>{char.description}</Text> : null}
        </View>
      ) : (
        <View style={styles.emptyTab}>
          <Icon name="cpu" size={32} color={COLORS.statusInactiveIcon} />
          <Text style={styles.emptyTitle}>{activeAgent?.name || activeAgentId}</Text>
          <Text style={styles.emptySubtitle}>
            Tekan ikon titik tiga di kanan atas untuk mengganti model khusus sesi ini.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingBottom: 60,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontFamily: FONTS.bold,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  wrap: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
  },
  cardGap: {
    marginTop: SPACING.md,
  },
  label: {
    color: COLORS.brandPinkSoft,
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    marginBottom: 6,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
});
