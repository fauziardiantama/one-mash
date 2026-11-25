import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ReplyTarget } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import Icon, { type IconName } from '../ui/Icon';
import ComposerReplyPreview from './ComposerReplyPreview';

const ATTACH_OPTIONS: Array<{ icon: IconName; label: string; key: 'camera' | 'gallery' | 'file' }> = [
  { icon: 'camera', label: 'Kamera', key: 'camera' },
  { icon: 'image', label: 'Galeri', key: 'gallery' },
  { icon: 'file', label: 'File', key: 'file' },
];

interface ComposerProps {
  onSend: (text: string) => void;
  onAbort?: () => void;
  isStreaming?: boolean;
  replyTo: ReplyTarget | null;
  onCancelReply: () => void;
  onAttachAction?: (key: 'camera' | 'gallery' | 'file') => void;
}

export default function Composer({
  onSend,
  onAbort,
  isStreaming = false,
  replyTo,
  onCancelReply,
  onAttachAction,
}: ComposerProps) {
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const hasText = text.trim().length > 0;

  const handleSend = () => {
    if (!hasText) return;
    onSend(text);
    setText('');
  };

  return (
    <View style={styles.wrap}>
      {menuOpen && (
        <View style={styles.menu}>
          {ATTACH_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              activeOpacity={0.7}
              style={styles.menuRow}
              onPress={() => {
                setMenuOpen(false);
                onAttachAction?.(opt.key);
              }}>
              <Icon name={opt.icon} size={20} color={COLORS.textPrimary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.bar}>
        <ComposerReplyPreview replyTo={replyTo} onCancel={onCancelReply} />
        <View style={styles.inputRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.circleBtn}
            onPress={() => setMenuOpen((v) => !v)}>
            <Icon name="plus" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Kirim pesan"
            placeholderTextColor={COLORS.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          {isStreaming ? (
            <TouchableOpacity activeOpacity={0.7} style={styles.sendBtn} onPress={onAbort}>
              <Icon name="square" size={16} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : hasText ? (
            <TouchableOpacity activeOpacity={0.7} style={styles.sendBtn} onPress={handleSend}>
              <Icon name="arrow-up" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={0.7} style={styles.circleBtn}>
              <Icon name="mic" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  menu: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  menuIcon: {
    marginRight: SPACING.md,
  },
  menuLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  bar: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.composer,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingHorizontal: SPACING.sm,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brandMagenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
