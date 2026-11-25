import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../../store';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import Icon from '../ui/Icon';
import InTreeBottomSheet from '../ui/InTreeBottomSheet';

interface ModelPickerSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function ModelPickerSheet({ visible, onClose }: ModelPickerSheetProps) {
  const activeAgentId = useStore((s) => s.agents.activeAgentId);
  const agentsList = useStore((s) => s.agents.list);
  const models = useStore((s) => s.agents.models);
  const loadModels = useStore((s) => s.agents.loadModels);
  const activeSessionModel = useStore((s) => s.chat.activeSessionModel);
  const activeSessionModelOverridden = useStore((s) => s.chat.activeSessionModelOverridden);
  const switchingModel = useStore((s) => s.chat.switchingModel);
  const setSessionModel = useStore((s) => s.chat.setSessionModel);

  const [pendingRef, setPendingRef] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadModels().catch(() => {});
    }
  }, [visible, loadModels]);

  const activeAgent = agentsList.find((a) => a.id === activeAgentId);
  const currentModel = activeSessionModel || activeAgent?.modelPrimary || '';

  const handleSelectModel = async (modelRef: string | null) => {
    setPendingRef(modelRef ?? '__reset__');
    try {
      await setSessionModel(modelRef);
      onClose();
    } catch (err: unknown) {
      Alert.alert('Gagal Mengubah Model', err instanceof Error ? err.message : String(err));
    } finally {
      setPendingRef(null);
    }
  };

  return (
    <InTreeBottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Ubah Model Sesi</Text>
      <Text style={styles.subtitle}>
        Hanya berlaku untuk sesi aktif ini ({activeAgent?.name || activeAgentId}), tidak mengubah model default agen.
      </Text>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {models.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada model tersedia di OpenClaw.</Text>
        ) : (
          models.map((item) => {
            const isSelected = currentModel === item.ref || currentModel === item.id;
            const isBusy = switchingModel && pendingRef === item.ref;
            const badge = item.tags?.[0];
            return (
              <TouchableOpacity
                key={item.ref}
                activeOpacity={0.75}
                disabled={switchingModel}
                style={[styles.row, isSelected && styles.rowActive]}
                onPress={() => handleSelectModel(item.ref)}>
                <Icon name="cpu" size={18} color={isSelected ? COLORS.brandPinkSoft : COLORS.textMuted} />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.ref}
                    {badge ? ` · ${badge}` : ''}
                  </Text>
                </View>
                {isBusy ? (
                  <ActivityIndicator size="small" color={COLORS.brandPinkSoft} />
                ) : isSelected ? (
                  <Icon name="check" size={18} color={COLORS.brandPinkSoft} />
                ) : null}
              </TouchableOpacity>
            );
          })
        )}

        {activeSessionModelOverridden && (
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={switchingModel}
            style={styles.resetRow}
            onPress={() => handleSelectModel(null)}>
            <Icon name="refresh-cw" size={16} color={COLORS.textMuted} />
            <Text style={styles.resetText}>Kembalikan ke Model Default Agen</Text>
            {switchingModel && pendingRef === '__reset__' ? (
              <ActivityIndicator size="small" color={COLORS.textPrimary} />
            ) : null}
          </TouchableOpacity>
        )}
      </ScrollView>
    </InTreeBottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  list: {
    maxHeight: 320,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rowActive: {
    borderWidth: 1,
    borderColor: COLORS.brandMagenta,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.mono,
    marginTop: 2,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surfaceControl,
    gap: SPACING.sm,
  },
  resetText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
});
