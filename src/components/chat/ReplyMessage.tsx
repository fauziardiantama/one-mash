import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage, ReplyTarget } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import Icon from '../ui/Icon';
import ChatBubble from './ChatBubble';

interface ReplyMessageProps {
  message: ChatMessage;
  onReply?: (target: ReplyTarget) => void;
  isFirst: boolean;
  isLast: boolean;
  defaultAiName?: string;
}

export default function ReplyMessage({
  message,
  onReply,
  isFirst,
  isLast,
  defaultAiName,
}: ReplyMessageProps) {
  if (!message.replyTo) {
    return (
      <ChatBubble
        role={message.role}
        author={message.author}
        text={message.text}
        isFirst={isFirst}
        isLast={isLast}
        onReply={onReply}
        defaultAiName={defaultAiName}
      />
    );
  }

  return (
    <View style={{ marginBottom: isLast ? SPACING.md : SPACING.xs }}>
      <View style={styles.labelRow}>
        <Icon name="corner-up-left" size={14} color={COLORS.textMuted} />
        <Text style={styles.label}>Anda membalas {message.replyTo.author}</Text>
      </View>
      <View style={styles.quotedBubble}>
        <Text style={styles.quotedText} numberOfLines={2}>
          {message.replyTo.text}
        </Text>
      </View>
      <ChatBubble
        role={message.role}
        author={message.author}
        text={message.text}
        isFirst={isFirst}
        isLast={isLast}
        onReply={onReply}
        defaultAiName={defaultAiName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginLeft: 6,
  },
  quotedBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    maxWidth: '85%',
    marginBottom: -SPACING.xs,
  },
  quotedText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
});
