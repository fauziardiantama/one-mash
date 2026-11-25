import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useStore } from '../../store';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import AppButton from '../ui/AppButton';

export default function EarTabContent() {
  const notifications = useStore((s) => s.notifications.list);
  const sleep = useStore((s) => s.notifications.config.notification_sleep);
  const toggleSleep = useStore((s) => s.notifications.toggleSleep);
  const flushNow = useStore((s) => s.notifications.flushNow);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.sleepCard}>
        <View style={styles.sleepTextCol}>
          <Text style={styles.sleepTitle}>Ear Sleep Mode</Text>
          <Text style={styles.sleepDesc}>
            {sleep ? 'Notifikasi ditahan di antrean SQLite' : 'Dikirim ke agent main tiap 5 detik'}
          </Text>
        </View>
        <Switch
          value={sleep}
          onValueChange={(val) => toggleSleep(val, true).catch(() => {})}
          trackColor={{ false: COLORS.surfaceControl, true: COLORS.brandMagenta }}
          thumbColor={COLORS.textPrimary}
        />
      </View>

      <AppButton
        label="Flush Antrean Sekarang"
        variant="secondary"
        onPress={() => flushNow().catch(() => {})}
        style={styles.flushBtn}
      />

      {notifications.length === 0 ? (
        <Text style={styles.empty}>Belum ada notifikasi yang diterima Ear.</Text>
      ) : (
        notifications.slice(0, 20).map((n) => (
          <View key={String(n.id)} style={styles.itemCard}>
            <View style={styles.itemTop}>
              <Text style={styles.itemSource}>{n.app || n.source || 'system'}</Text>
              <Text style={styles.itemStatus}>{n.status}</Text>
            </View>
            {n.title ? <Text style={styles.itemTitle}>{n.title}</Text> : null}
            <Text style={styles.itemBody} numberOfLines={2}>
              {n.body || '(tanpa isi)'}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingBottom: 60 },
  sleepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sleepTextCol: { flex: 1, marginRight: SPACING.md },
  sleepTitle: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.bold },
  sleepDesc: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  flushBtn: { marginBottom: SPACING.lg },
  empty: { color: COLORS.textDim, fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', marginTop: SPACING.xl },
  itemCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemSource: { color: COLORS.brandPinkSoft, fontSize: 12, fontFamily: FONTS.bold },
  itemStatus: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.regular },
  itemTitle: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.bold },
  itemBody: { color: COLORS.textSoft, fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
});
