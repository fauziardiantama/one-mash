import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, LAYOUT, SPACING } from '../../theme';
import Icon, { type IconName } from '../ui/Icon';

const TABS: Array<{ icon: IconName; active: boolean }> = [
  { icon: 'message-circle', active: true },
  { icon: 'file-text', active: false },
  { icon: 'zap', active: false },
  { icon: 'check-square', active: false },
  { icon: 'grid', active: false },
];

export default function TabBar() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: SPACING.md + insets.bottom }]}>
      {TABS.map((tab, i) => (
        <TouchableOpacity key={i} activeOpacity={0.7} style={styles.tab}>
          <Icon
            name={tab.icon}
            size={LAYOUT.tabBarIconSize}
            color={tab.active ? COLORS.textPrimary : COLORS.textMuted}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  tab: {
    padding: 6,
  },
});
