// Tripzo Design System
export const Colors = {
  navy: '#101B35',
  navyDark: '#0A1122',
  navyLight: '#1C2E59',
  orange: '#FF7547',
  orangeLight: '#FFF1EC',
  orangeHover: '#F06233',
  white: '#FFFFFF',
  background: '#F5F7FB',
  card: '#FFFFFF',
  text: '#19243B',
  textSecondary: '#6B7A99',
  textMuted: '#9AA6BF',
  border: '#E2E8F0',
  borderLight: '#EDF2F7',
  success: '#18A878',
  successLight: '#E8F7F2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  accent: '#3B82F6',
  accentLight: '#EFF6FF',
  gold: '#FBBF24',
  seaterAvailable: '#FFFFFF',
  seaterBooked: '#E2E8F0',
  seaterSelected: '#FF7547',
  seaterFemale: '#EC4899',
  sleeperBg: '#F8FAFC',
};

export const Shadows = {
  sm: {
    shadowColor: '#101B35',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#101B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#101B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  body1: { fontSize: 16, fontWeight: '400' as const, color: Colors.text, lineHeight: 22 },
  body2: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  button: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.2 },
};
