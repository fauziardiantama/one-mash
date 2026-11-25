import { LinearGradient } from 'expo-linear-gradient';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { COLORS, FONTS, GRADIENTS, LAYOUT, RADII, SPACING } from '../../theme';
import AgentAvatar from '../ui/AgentAvatar';
import HeaderButton from '../ui/HeaderButton';
import Icon from '../ui/Icon';

interface ChatHeaderProps {
  onMenuPress: () => void;
  status?: string | null;
  onLayout?: (e: LayoutChangeEvent) => void;
  isProfileOpen?: boolean;
  onOpenProfile?: () => void;
  onCloseProfile?: () => void;
  onEditAvatarPress?: () => void;
  onMorePress?: () => void;
}

export default function ChatHeader({
  onMenuPress,
  status,
  onLayout,
  isProfileOpen = false,
  onOpenProfile,
  onCloseProfile,
  onEditAvatarPress,
  onMorePress,
}: ChatHeaderProps) {
  const insets = useSafeAreaInsets();
  const activeAgentId = useStore((s) => s.agents.activeAgentId);
  const agentsList = useStore((s) => s.agents.list);
  const mode = useStore((s) => s.chat.mode);
  const activeGroupId = useStore((s) => s.chat.activeGroupId);
  const activeSessionModel = useStore((s) => s.chat.activeSessionModel);
  const activeSessionModelOverridden = useStore((s) => s.chat.activeSessionModelOverridden);
  const groupsList = useStore((s) => s.groups.list);

  const activeAgent = agentsList.find((a) => a.id === activeAgentId);
  const activeGroup = mode === 'group' ? groupsList.find((g) => g.id === activeGroupId) : null;
  const displayName = activeGroup ? activeGroup.name : activeAgent?.name || activeAgentId || 'Main Agent';
  const modelLabel = activeGroup
    ? `Multi-Agen (${activeGroup.members.length} anggota)`
    : activeSessionModel || activeAgent?.modelPrimary || 'Belum terdeteksi';

  const handleCenterPress = () => {
    if (!isProfileOpen && onOpenProfile) {
      onOpenProfile();
    }
  };

  return (
    <View style={styles.header} onLayout={onLayout}>
      <LinearGradient
        colors={GRADIENTS.fadeTop}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.row, { paddingTop: insets.top + SPACING.md }]}>
        {isProfileOpen ? (
          <HeaderButton icon="x" onPress={onCloseProfile} />
        ) : (
          <HeaderButton icon="menu" onPress={onMenuPress} />
        )}

        <TouchableOpacity
          activeOpacity={isProfileOpen ? 1 : 0.8}
          style={styles.center}
          onPress={handleCenterPress}>
          <View style={styles.avatarContainer}>
            <AgentAvatar
              agentId={activeGroup ? activeGroup.id : activeAgentId}
              name={displayName}
              size={LAYOUT.headerAvatarSize}
            />
            {isProfileOpen && (
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.editBadge}
                onPress={onEditAvatarPress}>
                <Icon name="edit-2" size={12} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
          </View>

          {isProfileOpen ? (
            <View style={styles.profileIdentityBlock}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileStatus}>{status || 'online'}</Text>
              <View style={styles.modelPill}>
                <Icon name="cpu" size={12} color={COLORS.brandPinkSoft} style={styles.modelIcon} />
                <Text style={styles.modelText} numberOfLines={1}>
                  {modelLabel}
                  {!activeGroup && activeSessionModelOverridden ? ' (sesi)' : ''}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.namePill}>
              <Text style={styles.name}>{displayName}</Text>
              {status ? <Text style={styles.status}>{status}</Text> : null}
            </View>
          )}
        </TouchableOpacity>

        {isProfileOpen ? (
          <HeaderButton icon="more-horizontal" disabled={mode === 'group'} onPress={onMorePress} />
        ) : (
          <View style={styles.sideSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 25,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    zIndex: 2,
    elevation: 4,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceControl,
    borderWidth: 2,
    borderColor: COLORS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  namePill: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
    marginTop: -SPACING.lg,
    alignItems: 'center',
    zIndex: 1,
    elevation: 1,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  status: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  profileIdentityBlock: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  profileStatus: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    marginTop: 6,
    maxWidth: 240,
  },
  modelIcon: {
    marginRight: 6,
  },
  modelText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  sideSpacer: {
    width: LAYOUT.headerButtonSize,
  },
});
