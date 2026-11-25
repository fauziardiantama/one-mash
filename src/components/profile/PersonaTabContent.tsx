import { StyleSheet, Text, View } from 'react-native';
import { useStore } from '../../store';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import Icon from '../ui/Icon';

export default function PersonaTabContent() {
  const activeAgentId = useStore((s) => s.agents.activeAgentId);
  const characters = useStore((s) => s.agents.characters);
  const char = characters.find((c) => c.agentId === activeAgentId);

  if (!char) {
    return (
      <View style={styles.emptyTab}>
        <Icon name="tv" size={36} color={COLORS.statusInactiveIcon} />
        <Text style={styles.emptyTitle}>Desktop</Text>
        <Text style={styles.emptySubtitle}>Desktop isn't available right now</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.label}>CHARACTER CARD V2</Text>
        <Text style={styles.name}>{char.characterName}</Text>
        <Text style={styles.meta}>Agent ID: {char.agentId} • Tools: Locked (None)</Text>
        {char.description ? <Text style={styles.desc}>{char.description}</Text> : null}
      </View>
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
