export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADII = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  composer: 28,
  avatar: 34,
  pill: 999,
} as const;

export const LAYOUT = {
  headerButtonSize: 44,
  headerAvatarSize: 68,
  headerDefaultHeight: 148,
  tabBarIconSize: 24,
  sidebarWidthRatio: 0.78,
  dragReplyThreshold: 60,
  avatarPivotY: 64,
} as const;

export const SHADOWS = {
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  overlay: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;
