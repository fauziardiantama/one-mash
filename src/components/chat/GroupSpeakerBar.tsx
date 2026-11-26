import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../../store';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';

export default function GroupSpeakerBar() {
  const mode = useStore((s) => s.chat.mode);
  const activeGroupId = useStore((s) => s.chat.activeGroupId);
  const activeGroupSpeaker = useStore((s) => s.chat.activeGroupSpeaker);
  const setGroupSpeaker = useStore((s) => s.chat.setGroupSpeaker);
  const groupsList = useStore((s) => s.groups.list);
  const agentsList = useStore((s) => s.agents.list);

  if (mode !== 'group' || !activeGroupId) return null;
  const activeGroup = groupsList.find((g) => g.id === activeGroupId);
  if (!activeGroup || activeGroup.members.length === 0) return null;

  const selected = activeGroupSpeaker && activeGroup.members.includes(activeGroupSpeaker)
    ? activeGroupSpeaker
    : activeGroup.members[0];

  const nameMap = new Map(agentsList.map((a) => [a.id, a.name]));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Pembicara:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {activeGroup.members.map((memberId) => {
          const isSelected = selected === memberId;
          const displayName = nameMap.get(memberId) || memberId;
          return (
            <TouchableOpacity
              key={memberId}
              activeOpacity={0.75}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setGroupSpeaker(memberId)}>
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]} numberOfLines={1}>
                {displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.bold,
    marginRight: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  chipActive: {
    backgroundColor: COLORS.brandMagenta,
    borderColor: COLORS.brandMagenta,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  chipTextActive: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
  },
});
