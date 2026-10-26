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

/** Series colours for charts: blue first, then the reference accent palette. */
export const CHART_COLORS = [
  MANAGER_COLORS.primary,
  MANAGER_COLORS.success,
  MANAGER_COLORS.warning,
  MANAGER_COLORS.thirdly,
  MANAGER_COLORS.danger,
  '#64748B',
]

/** Gradient strokes for the pipeline progress bars (one per stage). */
export const PIPELINE_STROKES = [
  { from: '#60A5FA', to: '#1565E8' },
  { from: '#38BDF8', to: '#0EA5E9' },
  { from: '#A78BFA', to: '#7C3AED' },
  { from: '#FBBF24', to: '#F59E0B' },
  { from: '#34D399', to: '#16A34A' },
]

export const TIMELINE_COLORS = ['#1565E8', '#16A34A', '#F59E0B', '#7C3AED']

/** Bar gradients (from, to) cycled per category. */
export const CHART_GRADIENTS: [string, string][] = [
  ['#60A5FA', '#1565E8'],
  ['#34D399', '#16A34A'],
  ['#FBBF24', '#F59E0B'],
  ['#A78BFA', '#7C3AED'],
  ['#F87171', '#DC2626'],
]
