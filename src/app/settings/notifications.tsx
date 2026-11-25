import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/ui/AppButton';
import FloatingHeader from '../../components/ui/FloatingHeader';
import { GroupedRow, GroupedSection } from '../../components/ui/GroupedSection';
import ScreenShell from '../../components/ui/ScreenShell';
import { useStore } from '../../store';
import { COLORS, FONTS, LAYOUT, RADII, SPACING } from '../../theme';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState<number>(LAYOUT.headerDefaultHeight);

  const list = useStore((s) => s.notifications.list);
  const batches = useStore((s) => s.notifications.batches);
  const config = useStore((s) => s.notifications.config);
  const loadNotifications = useStore((s) => s.notifications.loadNotifications);
  const toggleSleep = useStore((s) => s.notifications.toggleSleep);
  const flushNow = useStore((s) => s.notifications.flushNow);
  const clearAll = useStore((s) => s.notifications.clearAll);

  useEffect(() => {
    loadNotifications().catch(() => {});
  }, [loadNotifications]);

  const counts = config.counts || {};

  return (
    <ScreenShell>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
        <GroupedSection>
          <GroupedRow
            icon="bell"
            label="Notification Sleep"
            subtitle={
              config.notification_sleep
                ? 'Ditahan dalam log sementara hingga sleep dimatikan'
                : 'Otomatis dikelompokkan tiap 5 detik ke main agent'
            }
            switchValue={config.notification_sleep}
            onSwitchChange={(v) => toggleSleep(v, true).catch(() => {})}
            isLast
          />
        </GroupedSection>

        <View style={styles.statsCard}>
          <Text style={styles.statsText}>
            Held: {counts.held || 0} • Buffered: {counts.buffered || 0} • Batches: {batches.length}
          </Text>
          <View style={styles.btnRow}>
            <AppButton label="Flush" variant="magenta" onPress={() => flushNow().catch(() => {})} style={styles.flexBtn} />
            <AppButton label="Clear" variant="danger" onPress={() => clearAll().catch(() => {})} style={styles.flexBtn} />
          </View>
        </View>

        {list.length === 0 ? (
          <Text style={styles.empty}>Tidak ada log notifikasi tersimpan.</Text>
        ) : (
          list.map((n) => (
            <View key={String(n.id)} style={styles.item}>
              <View style={styles.itemHead}>
                <Text style={styles.source}>{n.app || n.source || 'system'}</Text>
                <Text style={styles.status}>{n.status}</Text>
              </View>
              {n.title ? <Text style={styles.title}>{n.title}</Text> : null}
              <Text style={styles.body}>{n.body || '(tanpa pesan)'}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <FloatingHeader
        title="Notifikasi (Ear)"
        onLeftPress={() => router.back()}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  statsCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statsText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.regular, marginBottom: SPACING.md },
  btnRow: { flexDirection: 'row', gap: SPACING.sm },
  flexBtn: { flex: 1 },
  empty: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', marginTop: SPACING.xl },
  item: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  source: { color: COLORS.brandPinkSoft, fontSize: 12, fontFamily: FONTS.bold },
  status: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.regular },
  title: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.bold },
  body: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
});
