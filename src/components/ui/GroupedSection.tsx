import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Switch, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import Icon, { type IconName } from './Icon';

export function GroupedSection({
  title,
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.box}>{children}</View>
    </View>
  );
}

interface GroupedRowProps {
  icon?: IconName;
  iconColor?: string;
  label: string;
  subtitle?: string;
  valueText?: string;
  onPress?: () => void;
  showChevron?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (next: boolean) => void;
  isLast?: boolean;
}

export function GroupedRow({
  icon,
  iconColor = COLORS.textPrimary,
  label,
  subtitle,
  valueText,
  onPress,
  showChevron = true,
  switchValue,
  onSwitchChange,
  isLast = false,
}: GroupedRowProps) {
  const hasSwitch = typeof switchValue === 'boolean' && Boolean(onSwitchChange);

  const content = (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      {icon ? <Icon name={icon} size={22} color={iconColor} style={styles.rowIcon} /> : null}
      <View style={styles.textCol}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {valueText ? <Text style={styles.valueText}>{valueText}</Text> : null}
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: COLORS.surfaceControl, true: COLORS.brandMagenta }}
          thumbColor={COLORS.textPrimary}
        />
      ) : showChevron ? (
        <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return <View>{content}</View>;
  }

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  box: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  rowIcon: {
    marginRight: SPACING.lg,
  },
  textCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  rowLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  rowSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  valueText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginRight: SPACING.sm,
  },
});
