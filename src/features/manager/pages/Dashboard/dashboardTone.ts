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

/** High-contrast categorical palette for multi-category charts (services, breakdowns). */
export const CHART_COLORS = [
  MANAGER_COLORS.primary, // #1565E8 Brand Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#0EA5E9', // Sky
  '#F43F5E', // Rose
  '#64748B', // Slate
]

/** Semantic status color mapping verified against backend Order & Mission enums. */
const STATUS_COLOR_MAP: Record<string, string> = {
  // Pending / review / waiting
  PENDING: '#F59E0B',
  PENDING_REVIEW: '#F59E0B',
  UNDER_REVIEW: '#F59E0B',
  NEEDS_MANAGER_REVIEW: '#F59E0B',
  WAITING_QUOTE: '#F59E0B',
  QUOTE_READY: '#0EA5E9',
  WAITING_CUSTOMER: '#8B5CF6',
  WAITING_DEPOSIT: '#EA580C',
  // Active / in-progress / scheduled
  APPROVED: '#1565E8',
  CONFIRMED: '#1565E8',
  DEPOSIT_PAID: '#0284C7',
  SCHEDULED: '#3B82F6',
  READY: '#0EA5E9',
  ASSIGNED: '#2563EB',
  IN_PROGRESS: '#1565E8',
  IN_FLIGHT: '#1565E8',
  RETURNING: '#6366F1',
  // Completed / success
  COMPLETED: '#10B981',
  DELIVERED: '#059669',
  DONE: '#10B981',
  ADJUSTED_AND_APPROVED: '#10B981',
  // Failed / rejected / issue
  FAILED: '#EF4444',
  REJECTED: '#EF4444',
  ISSUE: '#EF4444',
  // Cancelled / neutral
  CANCELLED: '#64748B',
  EXPIRED: '#94A3B8',
  DRAFT: '#94A3B8',
}

export function statusChartColor(statusKey?: string, fallbackIndex = 0): string {
  if (statusKey) {
    const upper = statusKey.trim().toUpperCase()
    if (STATUS_COLOR_MAP[upper]) return STATUS_COLOR_MAP[upper]
  }
  return CHART_COLORS[fallbackIndex % CHART_COLORS.length]
}
