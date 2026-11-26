import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ModelOption } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import AppButton from '../ui/AppButton';
import AppInput from '../ui/AppInput';
import InTreeBottomSheet from '../ui/InTreeBottomSheet';

interface CreateAgentSheetProps {
  visible: boolean;
  models: ModelOption[];
  loading: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; emoji?: string; workspace?: string; model?: string }) => Promise<void>;
}

export default function CreateAgentSheet({
  visible,
  models,
  loading,
  onClose,
  onCreate,
}: CreateAgentSheetProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onCreate({
      name: name.trim(),
      emoji: emoji.trim() || undefined,
      workspace: workspace.trim() || undefined,
      model: selectedModel || undefined,
    });
    setName('');
    setEmoji('');
    setWorkspace('');
    setSelectedModel('');
  };

  return (
    <InTreeBottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Buat Agen OpenClaw Baru</Text>
      <Text style={styles.sub}>Agen standar OpenClaw lengkap dengan workspace & dokumen otomatis.</Text>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AppInput
          label="Nama Agen"
          placeholder="Contoh: Research Assistant"
          variant="card"
          value={name}
          onChangeText={setName}
        />

        <AppInput
          label="Emoji (Opsional)"
          placeholder="Contoh: 🤖"
          variant="card"
          value={emoji}
          onChangeText={setEmoji}
        />

        <AppInput
          label="Workspace Path (Opsional)"
          placeholder="Kosongkan untuk path default OpenClaw"
          variant="card"
          autoCapitalize="none"
          value={workspace}
          onChangeText={setWorkspace}
        />

        <Text style={styles.label}>Primary Model (Opsional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, selectedModel === '' && styles.chipActive]}
            onPress={() => setSelectedModel('')}>
            <Text style={[styles.chipText, selectedModel === '' && styles.chipTextActive]}>Default Sistem</Text>
          </TouchableOpacity>
          {models.map((m) => {
            const active = selectedModel === m.ref;
            return (
              <TouchableOpacity
                key={m.ref}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedModel(m.ref)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.name || m.ref}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScrollView>

      <View style={styles.actions}>
        <AppButton label="Batal" variant="secondary" onPress={onClose} style={styles.btnFlex} />
        <AppButton
          label="Buat Agen"
          variant="magenta"
          loading={loading}
          disabled={!name.trim()}
          onPress={handleSubmit}
          style={styles.btnFlex}
        />
      </View>
    </InTreeBottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 330 },
  title: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONTS.bold, marginBottom: 4 },
  sub: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.regular, marginBottom: SPACING.lg },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginBottom: 6,
    marginLeft: 4,
  },
  chipsRow: { flexGrow: 0, marginBottom: SPACING.lg },
  chip: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginRight: SPACING.xs,
  },
  chipActive: { backgroundColor: COLORS.surfaceControl, borderColor: COLORS.brandPinkSoft },
  chipText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.medium },
  chipTextActive: { color: COLORS.textPrimary, fontFamily: FONTS.bold },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  btnFlex: { flex: 1 },
});
