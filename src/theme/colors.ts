// Centralized color tokens preserving authentic Meta Muse dark palette.
// Zero raw hex/rgba literals allowed outside src/theme/.

export const COLORS = {
  // Surfaces & Canvas
  canvas: '#000000',
  surface: '#121212',
  surfaceCard: '#1C1C1E',
  surfaceElevated: '#262626',
  surfaceControl: '#333336',
  surfacePressed: '#3A3A3A',
  surfaceIconNeutral: '#374151',
  surfaceBadgeSlate: '#27272A',

  // Borders & Dividers
  border: '#2C2C2E',
  borderSubtle: '#1F1F1F',
  borderMedium: '#38383A',
  divider: '#3A3A3C',

  // Text Hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#E5E5EA',
  textMuted: '#8E8E93',
  textSoft: '#A1A1AA',
  textLightGrey: '#D1D1D6',
  textDim: '#636366',
  textDisabled: '#666666',
  textDark: '#000000',

  // Brand & Accents (Muse Magenta + Soft Pink + Action Blue)
  brandMagenta: '#F02B9B',
  brandPinkSoft: '#F9A8D4',
  brandBlue: '#3B82F6',
  brandBlueTint: 'rgba(59, 130, 246, 0.08)',
  brandBlueSubtle: 'rgba(59, 130, 246, 0.05)',

  // Semantic Status
  statusSuccess: '#34C759',
  statusSuccessEmerald: '#10B981',
  statusSuccessBg: '#0E3820',
  statusSuccessTint: 'rgba(52, 199, 89, 0.15)',
  statusWarning: '#FACC15',
  statusWarningBg: '#422006',
  statusDanger: '#FF453A',
  statusDangerAlt: '#EF4444',
  statusDangerBg: 'rgba(239, 68, 68, 0.15)',
  statusDangerTint: 'rgba(255, 77, 79, 0.1)',
  statusInfo: '#60A5FA',
  statusInfoBg: '#1E3A8A',
  statusCyan: '#38BDF8',
  statusCyanBg: '#1E293B',
  statusPurple: '#C084FC',
  statusPurpleBg: '#4C1D95',
  statusInactiveIcon: '#48484A',

  // Overlays & Gradients
  overlayScrimLight: 'rgba(0, 0, 0, 0.4)',
  overlayScrim: 'rgba(0, 0, 0, 0.55)',
  overlayScrimHeavy: 'rgba(0, 0, 0, 0.6)',
  gradientOpaque: 'rgba(0, 0, 0, 1)',
  gradientTransparent: 'rgba(0, 0, 0, 0)',
} as const;

export const GRADIENTS = {
  fadeTop: [COLORS.gradientOpaque, COLORS.gradientTransparent] as const,
  fadeBottom: [COLORS.gradientTransparent, COLORS.gradientOpaque] as const,
};
