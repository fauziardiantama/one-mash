import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../../store';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import Icon from '../ui/Icon';

export default function GroupSpeakerBar() {
  const mode = useStore((s) => s.chat.mode);
  const activeGroupId = useStore((s) => s.chat.activeGroupId);
  const activeGroupSpeaker = useStore((s) => s.chat.activeGroupSpeaker);
  const messages = useStore((s) => s.chat.messages);
  const isStreaming = useStore((s) => s.chat.isStreaming);
  const setGroupSpeaker = useStore((s) => s.chat.setGroupSpeaker);
  const triggerGroupTurn = useStore((s) => s.chat.triggerGroupTurn);
  const groupsList = useStore((s) => s.groups.list);
  const agentsList = useStore((s) => s.agents.list);

  if (mode !== 'group' || !activeGroupId) return null;
  const activeGroup = groupsList.find((g) => g.id === activeGroupId);
  if (!activeGroup || activeGroup.members.length === 0) return null;

  const selected = activeGroupSpeaker && activeGroup.members.includes(activeGroupSpeaker)
    ? activeGroupSpeaker
    : activeGroup.members[0];

  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const canReply = Boolean(lastMsg) && !isStreaming && !(lastMsg?.role === 'ai' && lastMsg?.author === selected);

  const nameMap = new Map(agentsList.map((a) => [a.id, a.name]));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Pembicara:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.row}>
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
      <TouchableOpacity
        activeOpacity={0.75}
        disabled={!canReply}
        style={[styles.replyBtn, !canReply && styles.replyBtnDisabled]}
        onPress={() => {
          triggerGroupTurn(selected).catch(() => {});
        }}>
        <Icon
          name="corner-up-left"
          size={13}
          color={canReply ? COLORS.textPrimary : COLORS.textMuted}
        />
        <Text style={[styles.replyBtnText, !canReply && styles.replyBtnTextDisabled]}>Balas</Text>
      </TouchableOpacity>
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
  scroll: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingRight: SPACING.xs,
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
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceControl,
    borderWidth: 1,
    borderColor: COLORS.brandPinkSoft,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    marginLeft: SPACING.xs,
  },
  replyBtnDisabled: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  replyBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  replyBtnTextDisabled: {
    color: COLORS.textMuted,
  },
});
