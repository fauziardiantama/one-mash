import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../../store';
import type { ToolActivityItem } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import Icon, { type IconName } from '../ui/Icon';

function getToolVisual(toolName: string): { icon: IconName; bg: string; fg: string } {
  const lower = toolName.toLowerCase();
  if (lower.includes('shell') || lower.includes('exec') || lower.includes('bash')) {
    return { icon: 'zap', bg: COLORS.statusWarningBg, fg: COLORS.statusWarning };
  }
  if (lower.includes('search') || lower.includes('memory')) {
    return { icon: 'search', bg: COLORS.surfaceIconNeutral, fg: COLORS.textSoft };
  }
  if (lower.includes('read') || lower.includes('file') || lower.includes('ls')) {
    return { icon: 'file-text', bg: COLORS.statusCyanBg, fg: COLORS.statusCyan };
  }
  if (lower.includes('web') || lower.includes('fetch') || lower.includes('http')) {
    return { icon: 'globe', bg: COLORS.statusInfoBg, fg: COLORS.statusInfo };
  }
  return { icon: 'cpu', bg: COLORS.surfaceBadgeSlate, fg: COLORS.textLightGrey };
}

function isYesterday(date: Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return (
    date.getFullYear() === y.getFullYear() &&
    date.getMonth() === y.getMonth() &&
    date.getDate() === y.getDate()
  );
}

interface ActivityTabContentProps {
  onSelectActivity: (item: ToolActivityItem) => void;
}

export default function ActivityTabContent({ onSelectActivity }: ActivityTabContentProps) {
  const [refreshing, setRefreshing] = useState(false);
  const toolActivities = useStore((s) => s.chat.toolActivities);
  const openDirectChat = useStore((s) => s.chat.openDirectChat);
  const activeAgentId = useStore((s) => s.agents.activeAgentId);
  const activeSessionKey = useStore((s) => s.chat.activeSessionKey);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await openDirectChat(activeAgentId, activeSessionKey);
    } finally {
      setRefreshing(false);
    }
  };

  const todayList = toolActivities.filter((item) => !isYesterday(item.rawDate));
  const yesterdayList = toolActivities.filter((item) => isYesterday(item.rawDate));

  const renderRow = (item: ToolActivityItem) => {
    const vis = getToolVisual(item.toolName);
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.7}
        style={styles.activityRow}
        onPress={() => onSelectActivity(item)}>
        <View style={[styles.iconBox, { backgroundColor: vis.bg }]}>
          <Icon name={vis.icon} size={20} color={vis.fg} />
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.time}>{item.time}</Text>
          {item.hasAlertDot ? <View style={styles.unreadBadgeRight} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.textMuted}
          colors={[COLORS.textMuted, COLORS.textPrimary]}
          progressBackgroundColor={COLORS.surfaceCard}
        />
      }>
      <Text style={styles.dateHeader}>Hari ini</Text>
      {todayList.length > 0 ? (
        todayList.map(renderRow)
      ) : (
        <Text style={styles.emptyNotice}>Belum ada aktivitas tool pada sesi ini.</Text>
      )}

      {yesterdayList.length > 0 && (
        <>
          <Text style={styles.dateHeader}>Kemarin</Text>
          {yesterdayList.map(renderRow)}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: 60,
  },
  dateHeader: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 3,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 50,
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  unreadBadgeRight: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brandBlue,
    marginTop: 6,
  },
  emptyNotice: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: FONTS.regular,
    paddingVertical: SPACING.lg,
  },
});
