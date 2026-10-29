import { theme, type ThemeConfig } from 'antd'

/**
 * App palette (manager and customer portals). Mirrors the reference project's tailwind.config.js
 * (primary / secondary / warning / danger / thirdly) with BLUE as the
 * primary colour instead of the reference's green. Keep in sync with the
 * `@theme` block in src/styles/global.css and the CSS variables in
 * shared/styles/app-shell/layout.scss.
 */
export const APP_COLORS = {
  primary: '#1565E8',
  secondary: '#0958d9',
  warning: '#F59E0B',
  danger: '#DC2626',
  thirdly: '#8B5CF6',
  success: '#16A34A',
  info: '#1D4ED8',
  cyan: '#0891B2',
} as const

/** Type scale (px) - mirrors the --mgr-fs-* CSS tokens in app-shell/layout.scss. */
export const APP_TYPE_SCALE = {
  title: 24,
  section: 16,
  body: 14,
  small: 13,
  caption: 12,
  kpi: 28,
} as const

/** 4/8 spacing grid (px) - mirrors --mgr-gap / --mgr-page-pad / --mgr-card-pad. */
export const APP_SPACING = { gap: 16, gapLg: 24, pagePad: 24, pagePadMobile: 16, cardPad: 20 } as const

/** Gradient pairs (from, to) used for icon tiles, hero and chart fills. */
export const APP_GRADIENTS = {
  blue: ['#3B82F6', '#1565E8'],
  green: ['#34D399', '#16A34A'],
  amber: ['#FBBF24', '#F59E0B'],
  violet: ['#A78BFA', '#7C3AED'],
  red: ['#F87171', '#DC2626'],
  hero: ['#1565E8', '#4F46E5'],
} as const

export const APP_SURFACES = {
  light: { layout: '#EEF3FB', card: '#FFFFFF', border: '#E1E8F3' },
  dark: { layout: '#0A1022', card: '#121D3A', border: '#27365E', elevated: '#182546' },
} as const

// Be Vietnam Pro is designed for Vietnamese diacritics (Finlandica crowds
// stacked marks). Loaded in layout.scss.
export const APP_FONT_FAMILY =
  "'Be Vietnam Pro', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

export const APP_SIDER_WIDTH = 272
/** Width of the desktop icon rail shown when the sider is collapsed. */
export const APP_SIDER_RAIL_WIDTH = 80

export function buildAppTheme(dark: boolean): ThemeConfig {
  const s = dark ? APP_SURFACES.dark : APP_SURFACES.light
  return {
    algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: APP_COLORS.primary,
      colorInfo: APP_COLORS.secondary,
      colorWarning: APP_COLORS.warning,
      colorError: APP_COLORS.danger,
      colorSuccess: APP_COLORS.success,
      fontFamily: APP_FONT_FAMILY,
      borderRadius: 8,
      borderRadiusLG: 12,
      fontSize: 14,
      lineHeight: 1.5,
      colorTextSecondary: dark ? '#A3B1CF' : '#5B6B86',
      colorTextDescription: dark ? '#A3B1CF' : '#5B6B86',
      colorBgLayout: s.layout,
      colorBgContainer: s.card,
      colorBorderSecondary: s.border,
      ...(dark
        ? { colorBgElevated: APP_SURFACES.dark.elevated, colorBorder: '#34457A' }
        : {}),
    },
    components: {
      Menu: {
        itemBg: 'transparent',
        itemBorderRadius: 10,
        itemMarginBlock: 3,
        itemMarginInline: 0,
        itemHeight: 42,
        activeBarBorderWidth: 0,
        itemSelectedBg: dark ? 'rgba(91, 155, 255, 0.2)' : 'rgba(21, 101, 232, 0.1)',
        itemSelectedColor: dark ? '#A9CCFF' : APP_COLORS.primary,
        itemHoverBg: dark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
        darkItemBg: 'transparent',
      },
      Card: { headerFontSize: 16, headerHeight: 56, paddingLG: 20, fontWeightStrong: 600 },
      Table: {
        headerBg: dark ? '#182546' : '#F4F7FD',
        headerColor: dark ? '#A3B1CF' : '#5B6B86',
        headerSplitColor: 'transparent',
        headerBorderRadius: 0,
        rowHoverBg: dark ? 'rgba(96,165,250,0.07)' : 'rgba(21,101,232,0.045)',
        rowSelectedBg: 'rgba(21, 101, 232, 0.1)',
        rowSelectedHoverBg: 'rgba(21, 101, 232, 0.14)',
        borderColor: s.border,
        cellPaddingBlock: 14,
        cellFontSize: 14,
      },
      Select: { optionSelectedBg: 'rgba(21, 101, 232, 0.1)' },
      Button: {
        fontWeight: 600,
        controlHeight: 38,
        controlHeightSM: 30,
        borderRadiusSM: 8,
      },
      Modal: {
        contentBg: dark ? APP_SURFACES.dark.elevated : '#FFFFFF',
        headerBg: dark ? APP_SURFACES.dark.elevated : '#FFFFFF',
        footerBg: dark ? APP_SURFACES.dark.elevated : '#FFFFFF',
      },
      Drawer: { colorBgElevated: dark ? APP_SURFACES.dark.elevated : '#FFFFFF' },
      Dropdown: { paddingBlock: 6 },
      Tag: { borderRadiusSM: 999 },
    },
  }
}
