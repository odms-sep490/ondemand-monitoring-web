import type { DetailItem } from './requestDetailTypes'
import type { OrderDetail } from '../../types/orders'

export const enumLabels: Record<string, string> = {
  INTERNAL: 'Nội bộ',
  LEGAL: 'Pháp lý',
  PARTNER_REPORT: 'Báo cáo cho đối tác',
  OTHER: 'Khác',
  AGRICULTURE: 'Phục vụ nông nghiệp',
  SURVEY_MONITORING: 'Đo đạc, khảo sát, giám sát từ trên cao',
  CONSTRUCTION_MONITORING: 'Giám sát tiến độ công trình',
  INDUSTRIAL_INSPECTION: 'Kiểm tra nhà xưởng và cơ sở sản xuất',
  AREA_MONITORING: 'Giám sát khu vực',
  FOREST_MONITORING: 'Giám sát tài nguyên rừng',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
  NONE: 'Không có',
  HAVE_PERMIT: 'Đã có giấy phép',
  NEED_SUPPORT: 'Cần hỗ trợ xin phép',
  WEEKLY: 'Hằng tuần',
  MONTHLY: 'Hằng tháng',
  AUTO_RESCHEDULE:
    'Tự động dời sang ngày phù hợp gần nhất trong khoảng thời gian khách đã chọn',
  CONTACT_CUSTOMER: 'Liên hệ khách hàng trước khi thay đổi lịch bay',
  CANCEL_ORDER: 'Không sắp xếp bay lại và hủy yêu cầu',
  PHOTO: 'Ảnh',
  IMAGE: 'Ảnh',
  VIDEO: 'Video',
  PDF_REPORT: 'Báo cáo PDF',
  ORTHOMOSAIC: 'Bản đồ ghép ảnh',
  MODEL_3D: 'Mô hình 3D',
  PDF: 'PDF',
  DOWNLOAD: 'Tải về',
  EMAIL: 'Email',
  API: 'API',
  AI_IMAGE_ANALYSIS: 'AI phân tích hình ảnh',
}

export function text(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? (enumLabels[trimmed] ?? trimmed) : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'Có' : 'Không'
  return null
}

export function list(values: string[] | null | undefined): string | null {
  if (!values || values.length === 0) return null
  return values.map((value) => text(value) ?? value).join(', ')
}

export function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

export function dateTime(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

export function visibleItems(items: DetailItem[]) {
  return items.filter((item) => item.value != null && item.value !== '')
}

export function requirementValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    const values = value.map(requirementValue).filter(Boolean)
    return values.length ? values.join(', ') : null
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const parts = [
      text(record.type),
      text(record.description),
      record.additionalPrice != null
        ? `${text(record.additionalPrice)} đ`
        : null,
      text(record.fileName ?? record.name),
    ].filter(Boolean)
    return parts.length ? parts.join(' · ') : null
  }
  return text(value)
}

export function mediaTypeFromTitle(title: string | null | undefined) {
  const normalized = title?.trim().toLowerCase() ?? ''
  if (normalized.includes('video')) return 'Video'
  if (
    normalized.includes('ảnh') ||
    normalized.includes('hình') ||
    normalized.includes('photo') ||
    normalized.includes('image')
  ) {
    return 'Ảnh'
  }
  if (normalized.includes('báo cáo') || normalized.includes('report')) {
    return 'Báo cáo'
  }
  return null
}

export function formatMoney(value: unknown) {
  const amount =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : null
  return amount != null && Number.isFinite(amount)
    ? amount.toLocaleString('vi-VN') + ' đ'
    : text(value)
}

export function numberText(value: unknown): string | null {
  const valueText = text(value)
  return valueText && valueText !== '0' ? valueText : null
}

export function deliverableSummary(
  requirement: Record<string, unknown> | null,
  deliverableName?: string | null,
) {
  if (!requirement) return []
  // The deliverable heading already communicates its media type (for example,
  // "Video"). Only fall back to the requirement media type for generic names.
  const type = mediaTypeFromTitle(deliverableName)
    ? null
    : text(requirement.mediaType)
  return [
    type,
    numberText(requirement.quantity)
      ? `${numberText(requirement.quantity)} mục`
      : null,
    text(requirement.resolution),
    text(requirement.aiAnalysisRequested) === 'Có' ? 'Có AI' : null,
  ].filter((item): item is string => Boolean(item))
}

export function resultFormatsFromDeliverables(
  order: OrderDetail,
): string | null {
  const formats =
    order.deliverables
      ?.map((deliverable) => {
        const fromName = mediaTypeFromTitle(deliverable.deliverableTypeName)
        if (fromName) return fromName
        return text(deliverable.requirement?.mediaType)
      })
      .filter((item): item is string => Boolean(item)) ?? []

  const uniqueFormats = [...new Set(formats)]
  return uniqueFormats.length > 0 ? uniqueFormats.join(', ') : null
}

export function addOnItems(
  requirement: Record<string, unknown> | null,
): string[] {
  const value = requirement?.additionalRequirements
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return requirementValue(item)
      const record = item as Record<string, unknown>
      const title = text(record.type) ?? 'Yêu cầu bổ sung'
      const description = text(record.description)
      const price = formatMoney(record.additionalPrice)
      return [title, description, price].filter(Boolean).join(' · ')
    })
    .filter((item): item is string => Boolean(item))
}
