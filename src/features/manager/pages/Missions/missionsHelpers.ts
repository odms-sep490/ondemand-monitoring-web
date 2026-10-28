import type { MissionStatus } from '../../../../shared/types/domain'
import type {
  MissionCalendarItem,
  MissionStaffAssignmentResponse,
} from '../../types/missions'
import { getLanguage } from '../../../../shared/i18n'
import { missionsPageMessages } from './MissionsPage.messages'
import type { DeliveryStatus, PageMessages } from './missionsTypes'

export function formatScheduled(
  start: string | null,
  end: string | null,
  locale: 'vi-VN' | 'en-US',
): string {
  if (!start) return '—'
  const d = new Date(start)
  const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
  const startTime = d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (!end) return `${dateStr} ${startTime}`
  const endD = new Date(end)
  const endTime = endD.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dateStr} ${startTime}–${endTime}`
}

export function formatStaffSummary(
  assignments?: MissionStaffAssignmentResponse[],
) {
  const active = assignments ?? []
  if (active.length === 0) return '—'
  const accepted = active.filter(
    (item) => item.responseStatus === 'ACCEPTED',
  ).length
  return missionsPageMessages[getLanguage()].staffAccepted(
    accepted,
    active.length,
  )
}

export function deliveryTone(
  status: DeliveryStatus,
): 'gray' | 'blue' | 'green' | 'red' {
  if (status === 'APPROVED') return 'green'
  if (status === 'PENDING_MANAGER_APPROVAL') return 'blue'
  if (status === 'REJECTED') return 'red'
  if (status === 'DELIVERED') return 'green'
  if (status === 'REVISION_REQUESTED') return 'red'
  if (
    ['CUSTOMER_REVIEW', 'FINAL_PAYMENT_PENDING', 'READY_FOR_DELIVERY'].includes(
      status,
    )
  )
    return 'blue'
  return 'gray'
}

export function deliveryLabel(status: DeliveryStatus, t: PageMessages) {
  if (status === 'APPROVED') return t.deliveryStatus.approved
  if (status === 'PENDING_MANAGER_APPROVAL')
    return t.deliveryStatus.pendingApproval
  if (status === 'REJECTED') return t.deliveryStatus.rejected
  if (status === 'NO_RESULT') return t.deliveryStatus.noResult
  if (status === 'PROCESSING') return t.deliveryStatus.processing
  if (status === 'READY_FOR_MANAGER_REVIEW')
    return t.deliveryStatus.readyForPreview
  if (status === 'CUSTOMER_REVIEW') return t.deliveryStatus.customerReview
  if (status === 'REVISION_REQUESTED') return t.deliveryStatus.revisionRequested
  if (status === 'FINAL_PAYMENT_PENDING')
    return t.deliveryStatus.finalPaymentPending
  if (status === 'PAYMENT_CONFIRMED' || status === 'READY_FOR_DELIVERY')
    return t.deliveryStatus.readyForDelivery
  if (status === 'DELIVERED') return t.deliveryStatus.delivered
  if (status === 'LOADING') return t.deliveryStatus.loading
  return t.deliveryStatus.none
}

export type MissionGroup =
  'preparing' | 'running' | 'review' | 'completed' | 'failed'

const GROUPS: Record<MissionGroup, readonly MissionStatus[]> = {
  preparing: [
    'CREATED',
    'WAITING_DEPOSIT',
    'RESOURCE_ASSIGNING',
    'WAITING_CREW_CONFIRMATION',
    'WAITING_OPERATOR_ACCEPTANCE',
    'SCHEDULED',
    'CONNECTED',
    'PREFLIGHT_CHECKING',
    'READY_TO_FLY',
    'FAILED_PREFLIGHT',
    'PENDING_APPROVAL',
  ],
  running: ['IN_FLIGHT', 'IN_PROGRESS', 'RETURNING', 'POSTFLIGHT_CHECKING'],
  review: ['PENDING_REVIEW'],
  completed: ['COMPLETED'],
  failed: ['FAILED', 'CANCELLED'],
}

export function groupCounts(
  missions: Array<{ status: MissionStatus }>,
): Record<MissionGroup, number> {
  const counts: Record<MissionGroup, number> = {
    preparing: 0,
    running: 0,
    review: 0,
    completed: 0,
    failed: 0,
  }
  for (const mission of missions) {
    for (const group of Object.keys(GROUPS) as MissionGroup[]) {
      if (GROUPS[group].includes(mission.status)) counts[group] += 1
    }
  }
  return counts
}

export function matchesMissionSearch(
  mission: MissionCalendarItem,
  search: string,
): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  const people = (mission.staffAssignments ?? []).map(
    (item) => item.staffName ?? item.staffEmail ?? '',
  )
  return [
    mission.missionCode,
    mission.orderCode ?? '',
    mission.droneCode ?? '',
    mission.droneName ?? '',
    mission.operatorName ?? '',
    ...people,
  ]
    .join(' ')
    .toLowerCase()
    .includes(needle)
}
