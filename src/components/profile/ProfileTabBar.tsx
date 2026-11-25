import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { COLORS, RADII, SPACING } from '../../theme';
import Icon, { type IconName } from '../ui/Icon';

export type ProfileTabId = 'activity' | 'tasks' | 'display' | 'history';

const TABS: Array<{ id: ProfileTabId; icon: IconName }> = [
  { id: 'activity', icon: 'list' },
  { id: 'tasks', icon: 'shield' },
  { id: 'display', icon: 'tv' },
  { id: 'history', icon: 'clock' },
];

interface ProfileTabBarProps {
  activeTab: ProfileTabId;
  onSelectTab: (tab: ProfileTabId) => void;
}

export default function ProfileTabBar({ activeTab, onSelectTab }: ProfileTabBarProps) {
  const [barWidth, setBarWidth] = useState(0);
  const translateX = useSharedValue(0);

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const effectiveWidth = Math.max(0, barWidth - 8);
  const tabWidth = effectiveWidth > 0 ? effectiveWidth / TABS.length : 0;

  useEffect(() => {
    if (tabWidth > 0 && activeIndex >= 0) {
      translateX.value = withTiming(activeIndex * tabWidth, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [activeIndex, tabWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.segmentedBar} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
        {tabWidth > 0 && (
          <Reanimated.View
            style={[styles.slidingIndicator, { width: tabWidth }, indicatorStyle]}
          />
        )}
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabButton}>
              <Icon
                name={tab.icon}
                size={20}
                color={isActive ? COLORS.textPrimary : COLORS.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: SPACING.xl,
    zIndex: 10,
    elevation: 6,
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.xxl,
    padding: SPACING.xs,
    width: '100%',
    position: 'relative',
    justifyContent: 'space-between',
  },
  slidingIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    bottom: SPACING.xs,
    backgroundColor: COLORS.surfaceControl,
    borderRadius: RADII.xl,
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.xl,
    zIndex: 2,
  },
});
