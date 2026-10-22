export const Colors = {
  // Primary Greens
  primary: '#356B4B',
  primaryDark: '#254E35',
  primaryLight: '#48855F',
  primaryMuted: '#689679',

  // Surfaces & Backgrounds
  background: '#F4F7F4',
  card: '#FFFFFF',
  surfaceMint: '#D8EEDB',
  surfaceMintLight: '#E8F5EB',
  surfaceMintUltraLight: '#F1F8F2',

  // Text
  textPrimary: '#24352A',
  textSecondary: '#738176',
  textMuted: '#9BA99E',
  textWhite: '#FFFFFF',

  // Borders
  border: '#E1E9E2',
  borderFocus: '#356B4B',
  borderInput: '#D4DDD5',

  // States
  warning: '#D59B25',
  warningLight: '#FDF6E8',
  error: '#C94D4D',
  errorLight: '#FDEAEA',
  success: '#2E7D32',
  successLight: '#E6F5E8',
  info: '#2B6CB0',
  infoLight: '#EBF8FF',

  // Sensor specific colors
  moistureBlue: '#3B82F6',
  temperatureRed: '#EF4444',
  temperatureOrange: '#F59E0B',
  lightYellow: '#EAB308',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Typography = {
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  body: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textWhite,
  },
};

