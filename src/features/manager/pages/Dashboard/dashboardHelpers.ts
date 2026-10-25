import type { ActionItem } from '../../types/dashboard'
import type { ManagerRoute } from '../../routes'

export function actionItemRoute(item: ActionItem): ManagerRoute {
  if (item.actionType === 'VIEW_MISSION' && item.missionId) {
    return { screen: 'missionDetail', missionId: item.missionId }
  }
  if (item.orderId) return { screen: 'orderReview', orderId: item.orderId }
  if (item.type === 'MAINTENANCE_TICKET') return { screen: 'maintenance' }
  if (item.type === 'MEDIA_ACTION') return { screen: 'media' }
  return { screen: 'dashboard' }
}

export function statusLabel(status: string): string {
  return status.replaceAll('_', ' ')
}

export function formatDashboardDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
