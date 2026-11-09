import { MANAGER_COLORS } from '../../theme/managerTheme'

export type DashTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

/** antd <Tag color> presets for the shared status tones. */
export const TAG_COLOR: Record<DashTone, string> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'processing',
  neutral: 'default',
}

/** Monochrome blue scale for categorical dashboard data; status meaning stays labeled. */
export const CHART_COLORS = [
  MANAGER_COLORS.primary,
  '#397BEA',
  '#6095F0',
  '#88AFF4',
  '#B0C9F8',
  '#64748B',
]
