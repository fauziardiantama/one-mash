import { Alert, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../../store';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import AppButton from '../ui/AppButton';

export default function ModalPanel() {
  const modal = useStore((s) => s.providers.modal);
  const loading = useStore((s) => s.providers.loading);
  const deployModal = useStore((s) => s.providers.deployModal);
  const activateModal = useStore((s) => s.providers.activateModal);
  const deactivateModal = useStore((s) => s.providers.deactivateModal);
  const undeployModal = useStore((s) => s.providers.undeployModal);

  const runAction = (fn: () => Promise<void>, label: string) => {
    fn().catch((e) => Alert.alert(`${label} Gagal`, e instanceof Error ? e.message : String(e)));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Modal Serverless Inference</Text>
      <Text style={styles.metaText}>
        Status: {modal?.active ? 'Active' : modal?.deployed ? 'Deployed (Standby)' : 'Not Deployed'}
      </Text>
      {modal?.modelName ? <Text style={styles.metaText}>Model Alias: {modal.modelName}</Text> : null}
      {modal?.url ? <Text style={styles.urlText}>{modal.url}</Text> : null}

      <View style={styles.grid}>
        <AppButton label="Deploy" variant="secondary" loading={loading} onPress={() => runAction(deployModal, 'Deploy Modal')} />
        <AppButton label="Activate" variant="magenta" loading={loading} onPress={() => runAction(activateModal, 'Aktivasi Modal')} />
        <AppButton label="Deactivate" variant="secondary" loading={loading} onPress={() => runAction(deactivateModal, 'Deaktivasi Modal')} />
        <AppButton label="Undeploy" variant="danger" loading={loading} onPress={() => runAction(undeployModal, 'Undeploy Modal')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.bold, marginBottom: SPACING.sm },
  metaText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.regular, marginBottom: 4 },
  urlText: { color: COLORS.statusInfo, fontSize: 12, fontFamily: FONTS.mono, marginVertical: 4 },
  grid: { gap: SPACING.sm, marginTop: SPACING.md },
});
