import { theme, type ThemeConfig } from 'antd'

/**
 * Manager palette. Mirrors the reference project's tailwind.config.js
 * (primary / secondary / warning / danger / thirdly) with BLUE as the
 * primary colour instead of the reference's green. Keep in sync with the
 * `@theme` block in src/styles/global.css and the CSS variables in
 * components/layout/layout.scss.
 */
export const MANAGER_COLORS = {
  primary: '#1565E8',
  secondary: '#0958d9',
  warning: '#F59E0B',
  danger: '#DC2626',
  thirdly: '#8B5CF6',
  success: '#16A34A',
} as const

/** Gradient pairs (from, to) used for icon tiles, hero and chart fills. */
export const MANAGER_GRADIENTS = {
  blue: ['#3B82F6', '#1565E8'],
  green: ['#34D399', '#16A34A'],
  amber: ['#FBBF24', '#F59E0B'],
  violet: ['#A78BFA', '#7C3AED'],
  red: ['#F87171', '#DC2626'],
  hero: ['#1565E8', '#4F46E5'],
} as const

export const MANAGER_SURFACES = {
  light: { layout: '#F4F7FC', card: '#FFFFFF', border: '#E6ECF5' },
  dark: { layout: '#0B1226', card: '#111B36', border: '#1F2C4D', elevated: '#16213F' },
} as const

// Be Vietnam Pro is designed for Vietnamese diacritics (Finlandica crowds
// stacked marks). Loaded in layout.scss.
export const MANAGER_FONT_FAMILY =
  "'Be Vietnam Pro', 'Inter', ui-sans-serif, system-ui, sans-serif"

export const MANAGER_SIDER_WIDTH = 272
/** Width of the desktop icon rail shown when the sider is collapsed. */
export const MANAGER_SIDER_RAIL_WIDTH = 80

export function buildManagerTheme(dark: boolean): ThemeConfig {
  const s = dark ? MANAGER_SURFACES.dark : MANAGER_SURFACES.light
  return {
    algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: MANAGER_COLORS.primary,
      colorInfo: MANAGER_COLORS.secondary,
      colorWarning: MANAGER_COLORS.warning,
      colorError: MANAGER_COLORS.danger,
      colorSuccess: MANAGER_COLORS.success,
      fontFamily: MANAGER_FONT_FAMILY,
      borderRadius: 10,
      borderRadiusLG: 16,
      colorBgLayout: s.layout,
      colorBgContainer: s.card,
      colorBorderSecondary: s.border,
      ...(dark
        ? { colorBgElevated: MANAGER_SURFACES.dark.elevated, colorBorder: '#2A3A62' }
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
        itemSelectedBg: 'rgba(21, 101, 232, 0.09)',
        itemSelectedColor: MANAGER_COLORS.primary,
        itemHoverBg: dark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
        darkItemBg: 'transparent',
      },
      Card: { headerFontSize: 16, headerHeight: 56, paddingLG: 20 },
      Table: {
        headerBg: dark ? '#16213F' : '#F6F8FD',
        headerColor: dark ? '#93A1C0' : '#64748B',
        headerSplitColor: 'transparent',
        headerBorderRadius: 0,
        rowHoverBg: dark ? 'rgba(96,165,250,0.07)' : 'rgba(21,101,232,0.045)',
        rowSelectedBg: 'rgba(21, 101, 232, 0.1)',
        rowSelectedHoverBg: 'rgba(21, 101, 232, 0.14)',
        borderColor: s.border,
        cellPaddingBlock: 14,
      },
      Select: { optionSelectedBg: 'rgba(21, 101, 232, 0.1)' },
      Button: {
        fontWeight: 600,
        controlHeight: 38,
        controlHeightSM: 30,
        borderRadiusSM: 8,
      },
      Modal: {
        contentBg: dark ? MANAGER_SURFACES.dark.elevated : '#FFFFFF',
        headerBg: dark ? MANAGER_SURFACES.dark.elevated : '#FFFFFF',
        footerBg: dark ? MANAGER_SURFACES.dark.elevated : '#FFFFFF',
      },
      Drawer: { colorBgElevated: dark ? MANAGER_SURFACES.dark.elevated : '#FFFFFF' },
      Dropdown: { paddingBlock: 6 },
      Tag: { borderRadiusSM: 999 },
    },
  }
}
