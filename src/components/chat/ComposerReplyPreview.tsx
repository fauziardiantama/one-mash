import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ReplyTarget } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';

interface ComposerReplyPreviewProps {
  replyTo: ReplyTarget | null;
  onCancel: () => void;
}

export default function ComposerReplyPreview({ replyTo, onCancel }: ComposerReplyPreviewProps) {
  if (!replyTo) return null;

  return (
    <View style={styles.preview}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>Membalas {replyTo.author}</Text>
        <Text style={styles.quote} numberOfLines={1}>
          {replyTo.text}
        </Text>
      </View>
      <TouchableOpacity activeOpacity={0.7} style={styles.cancel} onPress={onCancel}>
        <Text style={styles.cancelText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  textWrap: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  quote: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  cancel: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: COLORS.textPrimary,
    fontSize: 22,
  },
});
