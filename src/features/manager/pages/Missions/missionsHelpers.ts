import type { MissionStaffAssignmentResponse } from '../../types/missions'
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
  return `${accepted}/${active.length} đã nhận`
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
  if (status === 'APPROVED') return 'Kết quả đã duyệt'
  if (status === 'PENDING_MANAGER_APPROVAL') return 'Kết quả chờ duyệt'
  if (status === 'REJECTED') return 'Kết quả bị từ chối'
  if (status === 'NO_RESULT') return 'Chưa có kết quả'
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
