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

  const op = modal?.operation;
  const opRunning = op?.state === 'running';
  const isBusy = loading || opRunning;

  const runAction = (fn: () => Promise<void>, label: string) => {
    fn().catch((e) => Alert.alert(`${label} Gagal`, e instanceof Error ? e.message : String(e)));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Modal Serverless Inference</Text>
      <Text style={styles.metaText}>
        Status: {opRunning ? 'Processing...' : modal?.active ? 'Active' : modal?.deployed ? 'Deployed (Standby)' : 'Not Deployed'}
      </Text>
      {modal?.modelName ? <Text style={styles.metaText}>Model Alias: {modal.modelName}</Text> : null}
      {modal?.url ? <Text style={styles.urlText}>{modal.url}</Text> : null}
      {opRunning && op?.phase ? (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>{op.phase}</Text>
        </View>
      ) : null}
      {op?.state === 'failed' && op.error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{op.error}</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <AppButton label="Deploy" variant="secondary" loading={opRunning && op?.action === 'deploy'} disabled={isBusy} onPress={() => runAction(deployModal, 'Deploy Modal')} />
        <AppButton label="Activate" variant="magenta" loading={opRunning && op?.action === 'activate'} disabled={isBusy} onPress={() => runAction(activateModal, 'Aktivasi Modal')} />
        <AppButton label="Deactivate" variant="secondary" loading={opRunning && op?.action === 'deactivate'} disabled={isBusy} onPress={() => runAction(deactivateModal, 'Deaktivasi Modal')} />
        <AppButton label="Undeploy" variant="danger" loading={opRunning && op?.action === 'undeploy'} disabled={isBusy} onPress={() => runAction(undeployModal, 'Undeploy Modal')} />
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
  infoBanner: {
    backgroundColor: COLORS.brandBlueTint,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  infoBannerText: { color: COLORS.statusInfo, fontSize: 12, fontFamily: FONTS.medium },
  errorBanner: {
    backgroundColor: COLORS.statusDangerBg,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  errorBannerText: { color: COLORS.statusDanger, fontSize: 12, fontFamily: FONTS.medium },
  grid: { gap: SPACING.sm, marginTop: SPACING.md },
});
