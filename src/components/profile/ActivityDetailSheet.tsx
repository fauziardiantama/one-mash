import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ToolActivityItem } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import AppButton from '../ui/AppButton';
import Icon from '../ui/Icon';
import InTreeBottomSheet from '../ui/InTreeBottomSheet';

interface ActivityDetailSheetProps {
  visible: boolean;
  activity: ToolActivityItem | null;
  onClose: () => void;
}

export default function ActivityDetailSheet({ visible, activity, onClose }: ActivityDetailSheetProps) {
  return (
    <InTreeBottomSheet visible={visible && Boolean(activity)} onClose={onClose}>
      {activity ? (
        <>
          <View style={styles.statusRow}>
            <View style={styles.badgeSelesai}>
              <Text style={styles.badgeText}>{activity.statusLabel || 'Selesai'}</Text>
            </View>
            <Text style={styles.timestampText}>{activity.time}</Text>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.titleText}>{activity.title}</Text>
            <Text style={styles.subtitleText}>{activity.subtitle}</Text>

            <View style={styles.bodyBox}>
              <Text style={styles.bodyText}>{activity.detail}</Text>
            </View>

            <Text style={styles.sectionHeader}>EKSEKUSI</Text>

            <View style={styles.stepCard}>
              <View style={styles.stepIconWrap}>
                <Icon name="check" size={16} color={COLORS.statusSuccess} />
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Tercatat pada sesi OpenClaw</Text>
                <Text style={styles.stepDesc}>{activity.stepDesc}</Text>
              </View>
            </View>

            <AppButton label="Tutup" variant="secondary" onPress={onClose} style={styles.closeBtn} />
          </ScrollView>
        </>
      ) : null}
    </InTreeBottomSheet>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  badgeSelesai: {
    backgroundColor: COLORS.statusSuccessBg,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.statusSuccess,
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  timestampText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  contentScroll: {
    marginTop: SPACING.xs,
  },
  titleText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: FONTS.bold,
    lineHeight: 26,
    marginBottom: 6,
  },
  subtitleText: {
    color: COLORS.textSoft,
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  bodyBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.lg,
    padding: 14,
    marginBottom: SPACING.xl,
  },
  bodyText: {
    color: COLORS.textLightGrey,
    fontSize: 13,
    fontFamily: FONTS.mono,
    lineHeight: 19,
  },
  sectionHeader: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    marginBottom: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  stepIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.statusSuccessTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  stepDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  closeBtn: {
    marginTop: SPACING.sm,
  },
});
