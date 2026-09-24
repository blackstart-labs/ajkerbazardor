export const colors = {
  light: {
    bgCanvas: '#FAF7F2',
    bgSurface: '#FFFFFF',
    bgSubtle: '#F4EFEB',
    bgMuted: '#EBE5DF',

    textPrimary: '#1C1917',
    textSecondary: '#57534E',
    textMuted: '#78716C',
    textInverse: '#FAF7F2',

    brandPrimary: '#D97706',
    brandHover: '#B45309',
    brandSubtle: '#FEF3C7',
    brandBorder: '#FDE68A',
    brandInk: '#78350F',

    trendUp: '#B91C1C',
    trendUpBg: '#FEF2F2',
    trendUpBorder: '#FCA5A5',
    trendUpText: '#991B1B',

    trendDown: '#15803D',
    trendDownBg: '#F0FDF4',
    trendDownBorder: '#86EFAC',
    trendDownText: '#166534',

    trendSame: '#57534E',
    trendSameBg: '#F5F5F4',
    trendSameBorder: '#D6D3D1',
    trendSameText: '#44403C',

    trendNoData: '#78716C',
    trendNoDataBg: '#F5F5F4',
    trendNoDataBorder: '#D6D3D1',
    trendNoDataText: '#78716C',

    borderSubtle: '#E7E0D8',
    borderStrong: '#D6CEC5',
    focusRing: '#D97706',
  },
  dark: {
    bgCanvas: '#141210',
    bgSurface: '#1E1B18',
    bgSubtle: '#292522',
    bgMuted: '#38332E',

    textPrimary: '#FAF7F2',
    textSecondary: '#D6CEC5',
    textMuted: '#A8A29E',
    textInverse: '#1C1917',

    brandPrimary: '#F59E0B',
    brandHover: '#D97706',
    brandSubtle: '#332009',
    brandBorder: '#78350F',
    brandInk: '#FEF3C7',

    trendUp: '#F87171',
    trendUpBg: '#301414',
    trendUpBorder: '#7F1D1D',
    trendUpText: '#FCA5A5',

    trendDown: '#4ADE80',
    trendDownBg: '#0F2D17',
    trendDownBorder: '#14532D',
    trendDownText: '#86EFAC',

    trendSame: '#D6D3D1',
    trendSameBg: '#292524',
    trendSameBorder: '#44403C',
    trendSameText: '#E7E5E4',

    trendNoData: '#A8A29E',
    trendNoDataBg: '#242220',
    trendNoDataBorder: '#44403C',
    trendNoDataText: '#A8A29E',

    borderSubtle: '#2E2924',
    borderStrong: '#443E38',
    focusRing: '#F59E0B',
  },
} as const;

export const typography = {
  fontHeading: "'Anek Bangla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontBody: "'Hind Siliguri', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.6,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem',
} as const;

export const radius = {
  xs: '3px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
} as const;

export const motion = {
  durationFast: '150ms',
  durationNormal: '250ms',
  durationSlow: '400ms',
  easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;
