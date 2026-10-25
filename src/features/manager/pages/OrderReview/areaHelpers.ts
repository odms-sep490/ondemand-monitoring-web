import type { OrderDetail, LegalReviewStatus } from '../../types/orders'
import type { SavedAreaReview, AreaReviewChoice } from './areaTypes'
import { ordersApi } from '../../api/ordersApi'
import { managerHref } from '../../routes'

export function areaReviewFromOrder(
  order: OrderDetail,
): SavedAreaReview | null {
  if (!order.legalReviewStatus || order.legalReviewStatus === 'NOT_REVIEWED')
    return null
  const reviewedAt = order.flightAreaReviewedAt
    ? new Date(order.flightAreaReviewedAt).getTime()
    : Number.NaN
  const updatedAt = order.updatedAt
    ? new Date(order.updatedAt).getTime()
    : Number.NaN
  // A customer location correction updates the order after the verdict was
  // recorded. That verdict belongs to the old coordinates and is only history.
  if (
    order.status === 'PENDING' &&
    Number.isFinite(reviewedAt) &&
    Number.isFinite(updatedAt) &&
    updatedAt - reviewedAt > 1_000
  ) {
    return null
  }
  return {
    status: order.legalReviewStatus,
    requestedScopeFeasible: order.requestedScopeFeasible ?? null,
    reason: order.flightAreaReviewReason ?? null,
    note: order.flightAreaReviewNote ?? null,
    reviewer: order.flightAreaReviewedByName ?? null,
    reviewedAt: order.flightAreaReviewedAt ?? null,
  }
}

export const REVIEW_OPTIONS: Array<{
  status: AreaReviewChoice
  label: string
  hint: string
}> = [
  {
    status: 'NOT_REQUIRED',
    label: 'Khu vực phù hợp sơ bộ',
    hint: 'Có thể tiếp tục duyệt đơn và phân nguồn lực. Hồ sơ xin phép bay được thực hiện ở bước sau.',
  },
  {
    status: 'CHANGE_LOCATION',
    label: 'Yêu cầu khách đổi khu vực',
    hint: 'Trả đơn về cho khách chọn lại vị trí giám sát.',
  },
  {
    status: 'REJECTED',
    label: 'Khu vực không khả thi',
    hint: 'Khu vực hiện tại không thể triển khai theo yêu cầu.',
  },
]

export const UNSUITABLE_REASONS = [
  'Khu vực cấm/hạn chế không đáp ứng điều kiện',
  'Không thể bảo đảm phạm vi hoạt động',
  'Không thể xác minh điều kiện khu vực',
  'Lý do khác',
]

export function areaReviewLabel(status: LegalReviewStatus) {
  const labels: Record<LegalReviewStatus, string> = {
    NOT_REVIEWED: 'Chưa đánh giá',
    NOT_REQUIRED: 'Khu vực phù hợp sơ bộ',
    PENDING_PERMIT: 'Chờ xử lý giấy phép',
    APPROVED: 'Khu vực đã được xác nhận',
    REJECTED: 'Khu vực không khả thi',
  }
  return labels[status]
}

export async function resolveUnsuitable(
  order: OrderDetail,
  review: SavedAreaReview,
  decision: 'NEED_INFO' | 'REJECTED',
  confirm: (question: {
    title: string
    body: string
    action?: string
  }) => Promise<boolean>,
) {
  const needInfo = decision === 'NEED_INFO'
  const accepted = await confirm({
    title: needInfo ? 'Yêu cầu khách đổi khu vực?' : 'Từ chối đơn hàng?',
    body: needInfo
      ? 'Đơn sẽ được chuyển về cho khách để chọn lại khu vực giám sát. Bạn nên gọi báo trước cho khách.'
      : 'Đơn sẽ bị từ chối và đóng lại. Bạn nên gọi báo cho khách trước khi từ chối.',
    action: needInfo ? 'Yêu cầu đổi khu vực' : 'Từ chối đơn',
  })
  if (!accepted) return
  const reason = [review.reason, review.note].filter(Boolean).join(' — ')
  await ordersApi.submitApproval(order.id, {
    decision,
    reason,
    ...(needInfo ? { requestedUpdateScope: 'LOCATION' as const } : {}),
  })
  window.location.hash = managerHref({ screen: 'orderQueue' })
}

export function openMinistryMap(zoneCode: string) {
  window.open('https://cambay.mod.gov.vn/', '_blank', 'noopener,noreferrer')
  void navigator.clipboard?.writeText(zoneCode).catch(() => undefined)
}

export function riskLabel(level: string) {
  if (level === 'HIGH_RISK') return 'Rủi ro cao'
  if (level === 'NEEDS_REVIEW') return 'Cần xem xét'
  return 'Thuận lợi'
}

export function restrictedLabel(value: {
  dataAvailable: boolean
  pointInsideRestrictedZone: boolean
  monitoringAreaIntersectsRestrictedZone: boolean
}) {
  if (!value.dataAvailable) return 'Chưa có dữ liệu'
  if (value.pointInsideRestrictedZone) return 'Tâm vùng nằm trong vùng cấm'
  if (value.monitoringAreaIntersectsRestrictedZone)
    return 'Vùng giám sát giao vùng cấm'
  return 'Không giao vùng cấm'
}

export function distanceLabel(value: number | null | undefined) {
  return value == null
    ? 'Chưa xác định'
    : `${Math.round(value).toLocaleString('vi-VN')} m`
}

export function metersLabel(value: number | null | undefined) {
  return value == null ? 'Chưa xác định' : `${Math.round(value)} m AMSL`
}

export function ministryLabel(
  value:
    | {
        available: boolean
        violatedAreaSquareMeters?: number | null
        violatedZones: string[]
      }
    | undefined,
) {
  if (!value?.available) return 'Không kết nối được'
  if (
    (value.violatedAreaSquareMeters ?? 0) > 0 ||
    value.violatedZones.length > 0
  ) {
    return 'Có giao vùng cấm/hạn chế bay'
  }
  return 'Không ghi nhận giao vùng cấm'
}
