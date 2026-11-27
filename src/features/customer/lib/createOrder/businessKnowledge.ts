import type { ServiceOption, ServicePricingEstimate, PreferredTimeOption } from '../../api/customerApi'
import type { ChecklistRow } from '../checklist/types'
import type { FlightPurpose, FormState } from './types'
import { ALTITUDE_MAX, ALTITUDE_MIN } from './validators'

/**
 * Grounded business rules extracted from actual platform validators and API contracts.
 * Never invent service IDs, prices, discounts, or schedules outside these real sources.
 */
export const BUSINESS_RULES = {
  minScheduleLeadDays: 7,
  altitudeMinM: ALTITUDE_MIN,
  altitudeMaxM: ALTITUDE_MAX,
  serviceAreaLabel: 'TP. Hồ Chí Minh',
  phonePattern: /^[+0-9 ().-]{8,20}$/,
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const

export type AccountContact = {
  fullName?: string | null
  phone?: string | null
  email?: string | null
}

export type ServiceRecommendation = {
  service: ServiceOption
  purpose?: FlightPurpose
  reason: string
  shouldAutoSelect: boolean
}

export type RelativeDateResolution = {
  dateIso: string
  label: string
  timeSlotHint?: 'MORNING' | 'AFTERNOON' | 'EVENING'
  hour?: number
  meetsLeadTime: boolean
  earliestAllowedDate: string
}

export type ConditionalEvaluation = {
  handled: boolean
  satisfied: boolean
  canVerify: boolean
  explanation: string
  /** Action payload to execute only when `satisfied && canVerify`. */
  recommendedAction?:
    | { type: 'select_service'; serviceId: string }
    | { type: 'checklist_set_videos'; count: number }
    | { type: 'checklist_clear_optional' }
    | { type: 'set_schedule'; preferredDateFrom: string; preferredDateTo: string; timeId?: string }
}

export type DraftIssue = {
  field: string
  step: 1 | 2 | 3 | 4 | 5 | 6
  severity: 'error' | 'missing'
  message: string
}

function addDaysIso(iso: string, days: number): string {
  const date = new Date(iso + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')} ₫`
}

function normalizeSimple(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const SPOKEN_HOURS: Record<string, number> = {
  mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, sau: 6,
  bay: 7, tam: 8, chin: 9, muoi: 10, 'muoi mot': 11, 'muoi hai': 12,
}

function extractHourHint(normalized: string): { hour?: number; timeSlotHint?: 'MORNING' | 'AFTERNOON' | 'EVENING' } {
  let timeSlotHint: 'MORNING' | 'AFTERNOON' | 'EVENING' | undefined
  if (/\bsang\b/.test(normalized)) timeSlotHint = 'MORNING'
  else if (/\bchieu\b/.test(normalized)) timeSlotHint = 'AFTERNOON'
  else if (/\btoi\b/.test(normalized)) timeSlotHint = 'EVENING'

  const digitMatch = normalized.match(/\b(\d{1,2})\s*(?:gio|h)\b/)
  let hour: number | undefined
  if (digitMatch) {
    hour = Number(digitMatch[1])
  } else {
    for (const [word, value] of Object.entries(SPOKEN_HOURS)) {
      if (new RegExp(`\\b${word}\\s+gio\\b`).test(normalized)) {
        hour = value
        break
      }
    }
  }
  if (hour !== undefined) {
    if (timeSlotHint === 'AFTERNOON' && hour < 12) hour += 12
    else if (timeSlotHint === 'EVENING' && hour < 12) hour += 12
    else if (!timeSlotHint) {
      if (hour >= 5 && hour < 12) timeSlotHint = 'MORNING'
      else if (hour >= 12 && hour < 18) timeSlotHint = 'AFTERNOON'
      else if (hour >= 18) timeSlotHint = 'EVENING'
    }
  }
  return { hour, timeSlotHint }
}

/**
 * Resolve Vietnamese relative dates ("hôm nay", "ngày mai", "sáng mai", "ngày kia",
 * "cuối tuần", "thứ sáu tuần sau", "tuần sau") and check the 7-day lead-time rule.
 */
export function parseVietnameseRelativeDate(raw: string, today: string): RelativeDateResolution | null {
  const text = normalizeSimple(raw)
  const earliestAllowedDate = addDaysIso(today, BUSINESS_RULES.minScheduleLeadDays)
  const { hour, timeSlotHint } = extractHourHint(text)
  const baseDate = new Date(today + 'T00:00:00Z')
  const dayOfWeek = baseDate.getUTCDay() // 0 = Sun, 1 = Mon ... 6 = Sat

  let targetIso: string | null = null
  let label = ''

  if (/\bhom nay\b/.test(text)) {
    targetIso = today
    label = 'hôm nay'
  } else if (/\b(ngay mai|sang mai|chieu mai|toi mai)\b/.test(text)) {
    targetIso = addDaysIso(today, 1)
    label = /\bsang mai\b/.test(text) ? 'sáng mai' : /\bchieu mai\b/.test(text) ? 'chiều mai' : 'ngày mai'
  } else if (/\b(ngay kia|mot)\b/.test(text)) {
    targetIso = addDaysIso(today, 2)
    label = 'ngày kia'
  } else if (/\bcuoi tuan sau\b/.test(text)) {
    const daysToNextSat = ((6 - dayOfWeek + 7) % 7) + 7
    targetIso = addDaysIso(today, daysToNextSat)
    label = 'cuối tuần sau'
  } else if (/\bcuoi tuan\b/.test(text)) {
    const daysToSat = (6 - dayOfWeek + 7) % 7 || 7
    targetIso = addDaysIso(today, daysToSat)
    label = 'cuối tuần'
  } else {
    const weekdayMatch = text.match(/\bthu\s+(hai|ba|tu|bon|nam|sau|bay|2|3|4|5|6|7)\s+tuan sau\b/)
    if (weekdayMatch) {
      const map: Record<string, number> = {
        hai: 1, '2': 1, ba: 2, '3': 2, tu: 3, bon: 3, '4': 3,
        nam: 4, '5': 4, sau: 5, '6': 5, bay: 6, '7': 6,
      }
      const targetDow = map[weekdayMatch[1]]
      if (targetDow !== undefined) {
        const daysToNextMonday = ((8 - dayOfWeek) % 7) || 7
        targetIso = addDaysIso(today, daysToNextMonday + (targetDow - 1))
        label = `thứ ${weekdayMatch[1]} tuần sau`
      }
    } else if (/\bchu nhat tuan sau\b/.test(text)) {
      const daysToNextMonday = ((8 - dayOfWeek) % 7) || 7
      targetIso = addDaysIso(today, daysToNextMonday + 6)
      label = 'chủ nhật tuần sau'
    } else if (/\btuan sau\b/.test(text)) {
      targetIso = addDaysIso(today, 7)
      label = 'tuần sau'
    }
  }

  if (!targetIso) return null
  return {
    dateIso: targetIso,
    label,
    timeSlotHint,
    hour,
    meetsLeadTime: targetIso >= earliestAllowedDate,
    earliestAllowedDate,
  }
}

/** Match a time slot hint ("sáng", "chiều", "8 giờ", "sau 3 giờ chiều") to real preferredTimes options. */
export function matchPreferredTimeOption(
  raw: string,
  preferredTimes: PreferredTimeOption[],
): PreferredTimeOption | null {
  if (!preferredTimes.length) return null
  const text = normalizeSimple(raw)
  const { timeSlotHint, hour } = extractHourHint(text)
  if (!timeSlotHint && hour === undefined) return null

  const byKeyword = preferredTimes.find((option) => {
    const name = normalizeSimple(`${option.name} ${option.code ?? ''}`)
    if (timeSlotHint === 'MORNING' && /\b(sang|morning|am|07|08|09)\b/.test(name)) return true
    if (timeSlotHint === 'AFTERNOON' && /\b(chieu|afternoon|pm|13|14|15|16)\b/.test(name)) return true
    if (timeSlotHint === 'EVENING' && /\b(toi|evening|17|18|19)\b/.test(name)) return true
    return false
  })
  return byKeyword ?? null
}

type GoalRule = {
  pattern: RegExp
  serviceTokens: string[]
  purpose: FlightPurpose
  goalLabel: string
}

const GOAL_RULES: GoalRule[] = [
  {
    pattern: /\b(cong trinh|xay dung|xay toi dau|tien do thi cong|cong truong|nha dang xay)\b/,
    serviceTokens: ['cong trinh', 'xay dung', 'tien do'],
    purpose: 'CONSTRUCTION_MONITORING',
    goalLabel: 'theo dõi tiến độ công trình xây dựng',
  },
  {
    pattern: /\b(mai nha xuong|nha xuong|nha may|kho bai|khu cong nghiep|pin mat troi)\b/,
    serviceTokens: ['nha xuong', 'cong nghiep', 'nha may'],
    purpose: 'INDUSTRIAL_INSPECTION',
    goalLabel: 'kiểm tra mái và kết cấu nhà xưởng/cơ sở sản xuất',
  },
  {
    pattern: /\b(cay trong|nong nghiep|vuon|ruong|mua mang|lua|canh tac)\b/,
    serviceTokens: ['nong nghiep', 'cay trong'],
    purpose: 'AGRICULTURE',
    goalLabel: 'theo dõi tình trạng cây trồng và nông nghiệp',
  },
  {
    pattern: /\b(rung|lam nghiep|chay rung|tai nguyen rung|cay rung)\b/,
    serviceTokens: ['rung', 'lam nghiep'],
    purpose: 'FOREST_MONITORING',
    goalLabel: 'giám sát rừng và tài nguyên lâm nghiệp',
  },
  {
    pattern: /\b(do dac|khao sat|ban do|dia hinh|dien tich dat)\b/,
    serviceTokens: ['khao sat', 'do dac', 'dia hinh'],
    purpose: 'SURVEY_MONITORING',
    goalLabel: 'khảo sát và đo đạc khu vực',
  },
]

/**
 * Recommend an actual catalog service based on the customer's stated goal.
 * Distinguishes advisory recommendation (`shouldAutoSelect: false`) from explicit selection commands.
 */
export function recommendServiceForGoal(
  raw: string,
  services: ServiceOption[],
): ServiceRecommendation | null {
  const text = normalizeSimple(raw)
  const active = services.filter((s) => s.isActive !== false)
  if (!active.length) return null

  const rule = GOAL_RULES.find((item) => item.pattern.test(text))
  if (!rule) return null

  const matchedService = active.find((service) => {
    const hay = normalizeSimple(`${service.name} ${service.description ?? ''}`)
    return rule.serviceTokens.some((token) => hay.includes(token))
  })
  if (!matchedService) return null

  const isAdvisoryQuestion =
    /\b(nen chon|goi y|tu van|dich vu nao|xem .+ toi dau|kiem tra mai|theo doi tinh trang)\b/.test(text) &&
    !/\b(chon dich vu|doi sang|chuyen sang|lay dich vu|dat dich vu)\b/.test(text)

  const descPart = matchedService.description?.trim()
    ? ` (${matchedService.description.trim()})`
    : ''
  const pricePart =
    typeof matchedService.defaultPrice === 'number' && matchedService.defaultPrice > 0
      ? ` Giá tham khảo từ ${formatVnd(matchedService.defaultPrice)}.`
      : ''

  return {
    service: matchedService,
    purpose: rule.purpose,
    reason: `Với nhu cầu ${rule.goalLabel}, gói phù hợp là "${matchedService.name}"${descPart}.${pricePart}`,
    shouldAutoSelect: !isAdvisoryQuestion,
  }
}

/**
 * Answer pricing questions strictly from real catalog `defaultPrice` and live `ServicePricingEstimate`.
 * Always distinguishes reference price, estimated total, and Manager-confirmed final quotation.
 */
export function answerPricingQuestion(
  raw: string,
  context: {
    services: ServiceOption[]
    selectedService?: ServiceOption
    pricingEstimate?: ServicePricingEstimate | null
    checklistRows?: ChecklistRow[]
  },
): string | null {
  const text = normalizeSimple(raw)
  const isPricingQuestion =
    /\b(gia bao nhieu|bao nhieu tien|chi phi|re hon|tang gia|con bao nhieu|bao gia|gia dich vu|phi quay video)\b/.test(text)
  if (!isPricingQuestion) return null

  const active = context.services.filter((s) => s.isActive !== false)

  // 1. "Có dịch vụ nào rẻ hơn không?"
  if (/\bre hon\b/.test(text)) {
    const priced = active
      .filter((s): s is ServiceOption & { defaultPrice: number } => typeof s.defaultPrice === 'number' && s.defaultPrice > 0)
      .sort((a, b) => a.defaultPrice - b.defaultPrice)
    if (!priced.length) {
      return 'Hiện danh mục chưa có bảng giá tham khảo công khai cho các gói để so sánh; quản lý sẽ báo giá chính thức sau khi tiếp nhận yêu cầu.'
    }
    const currentPrice = context.selectedService?.defaultPrice
    const cheaper = currentPrice
      ? priced.filter((s) => s.id !== context.selectedService?.id && s.defaultPrice < currentPrice)
      : priced.slice(0, 3)
    if (!cheaper.length) {
      return `Gói hiện tại (${context.selectedService?.name ?? priced[0].name}) đang có mức giá tham khảo thấp nhất trong danh mục (${formatVnd(currentPrice ?? priced[0].defaultPrice)}).`
    }
    const list = cheaper
      .slice(0, 3)
      .map((s) => `${s.name} (tham khảo ${formatVnd(s.defaultPrice)})`)
      .join(', ')
    return `Các gói có mức giá tham khảo thấp hơn: ${list}. Đây là giá tham khảo, báo giá chính thức sẽ do quản lý xác nhận.`
  }

  // 2. "Thêm quay video có tăng giá không?"
  if (/\b(quay video|quay phim)\b/.test(text) && /\b(tang gia|them tien|bao nhieu|phi)\b/.test(text)) {
    const rows = context.checklistRows ?? []
    const extraVideoCharge = context.pricingEstimate?.additionalRequirements.find(
      (r) => r.type === 'CONTEXT_EXTRA_VIDEO' || /video/i.test(r.description),
    )
    if (extraVideoCharge && extraVideoCharge.additionalPrice > 0) {
      return `Phụ phí quay video bổ sung hiện dự kiến là ${formatVnd(extraVideoCharge.additionalPrice)}. Tổng dự kiến hiện tại là ${formatVnd(context.pricingEstimate!.totalPrice)} (chưa phải báo giá cuối cùng từ quản lý).`
    }
    if (rows.length > 0) {
      const hasIncludedVideo = rows.some((r) => r.selected && r.includedVideoCount > 0)
      if (hasIncludedVideo) {
        return 'Các hạng mục đang chọn đã bao gồm định mức video trong gói; chỉ khi tăng vượt định mức mới phát sinh phụ phí theo cấu hình và được quản lý xác nhận báo giá.'
      }
      return 'Thêm quay video vượt định mức gói có thể phát sinh chi phí bổ sung; hệ thống sẽ tự tính lại dự kiến khi cập nhật checklist và quản lý sẽ gửi báo giá chính thức.'
    }
    return 'Chi phí thêm quay video phụ thuộc vào định mức checklist của dịch vụ đang chọn; hãy chọn dịch vụ để hệ thống tính giá dự kiến chính xác.'
  }

  // 3. "Giá bao nhiêu?" / "Bỏ mục này thì còn bao nhiêu?"
  if (context.pricingEstimate && context.pricingEstimate.totalPrice > 0) {
    const est = context.pricingEstimate
    const pendingNote = est.quotePending
      ? ' Một số hạng mục đang chờ quản lý báo giá chi tiết.'
      : ' Đây là giá dự kiến theo cấu hình hiện tại; báo giá chính thức sẽ do quản lý xác nhận.'
    return `Chi phí dự kiến hiện tại: ${formatVnd(est.totalPrice)} (gói cơ bản ${formatVnd(est.servicePrice)}).${pendingNote}`
  }

  if (context.selectedService) {
    if (typeof context.selectedService.defaultPrice === 'number' && context.selectedService.defaultPrice > 0) {
      return `Gói "${context.selectedService.name}" có giá tham khảo từ ${formatVnd(context.selectedService.defaultPrice)}. Tổng dự kiến chính xác sẽ cập nhật theo khu vực và checklist, sau đó quản lý xác nhận báo giá cuối cùng.`
    }
    return `Gói "${context.selectedService.name}" hiện chưa niêm yết giá cố định; quản lý sẽ xem xét yêu cầu và gửi báo giá chính thức.`
  }

  return 'Anh/chị chưa chọn dịch vụ nên chưa có giá dự kiến. Hãy chọn một dịch vụ để tôi kiểm tra mức giá tham khảo thực tế.'
}

/**
 * Evaluate conditional user instructions strictly against real runtime data.
 * Never assumes an unverifiable condition is true.
 */
export function evaluateConditionalRequest(
  raw: string,
  context: {
    services: ServiceOption[]
    selectedService?: ServiceOption
    preferredTimes?: PreferredTimeOption[]
    checklistRows?: ChecklistRow[]
    today: string
  },
): ConditionalEvaluation | null {
  const text = normalizeSimple(raw)
  if (!/\bneu\b/.test(text)) return null

  // 1. "Nếu dịch vụ này dưới 3 triệu thì chọn"
  const priceMatch = text.match(/duoi\s+(\d+(?:[.,]\d+)?)\s*(trieu|tr|nghin|k)/)
  if (priceMatch && /\b(chon|lay|dat)\b/.test(text)) {
    const amount = Number(priceMatch[1].replace(',', '.'))
    const multiplier = priceMatch[2] === 'trieu' || priceMatch[2] === 'tr' ? 1_000_000 : 1_000
    const cap = amount * multiplier
    const target = context.selectedService ?? context.services.find((s) => s.isActive !== false)
    if (!target || typeof target.defaultPrice !== 'number' || target.defaultPrice <= 0) {
      return {
        handled: true,
        satisfied: false,
        canVerify: false,
        explanation: 'Chưa thể kiểm tra điều kiện giá vì dịch vụ này chưa có mức giá tham khảo niêm yết (chờ quản lý báo giá), nên tôi chưa tự chọn.',
      }
    }
    if (target.defaultPrice < cap) {
      return {
        handled: true,
        satisfied: true,
        canVerify: true,
        explanation: `Gói "${target.name}" có giá tham khảo ${formatVnd(target.defaultPrice)} (< ${formatVnd(cap)}), thỏa điều kiện.`,
        recommendedAction: { type: 'select_service', serviceId: target.id },
      }
    }
    return {
      handled: true,
      satisfied: false,
      canVerify: true,
      explanation: `Gói "${target.name}" có giá tham khảo ${formatVnd(target.defaultPrice)}, không dưới ${formatVnd(cap)}, nên tôi chưa chọn.`,
    }
  }

  // 2. "Nếu sáng mai còn lịch thì đặt lịch dự kiến lúc 8 giờ"
  if (/\b(con lich|lich bay|dat lich)\b/.test(text)) {
    const rel = parseVietnameseRelativeDate(raw, context.today)
    if (rel && !rel.meetsLeadTime) {
      return {
        handled: true,
        satisfied: false,
        canVerify: true,
        explanation: `Chưa thể đặt ${rel.label} (${rel.dateIso}) vì hệ thống yêu cầu đặt lịch trước tối thiểu ${BUSINESS_RULES.minScheduleLeadDays} ngày (từ ${rel.earliestAllowedDate} trở đi).`,
      }
    }
    if (rel && rel.meetsLeadTime) {
      return {
        handled: true,
        satisfied: false,
        canVerify: false,
        explanation: `Hiện tại trợ lý chưa có dữ liệu trống lịch theo thời gian thực để xác nhận "${rel.label}" còn lịch hay không, nên chưa tự đặt lịch dự kiến. Anh/chị có muốn tôi điền ngày đề xuất ${rel.dateIso} để quản lý kiểm tra không?`,
      }
    }
  }

  // 3. "Nếu có quay video thì thêm vào"
  if (/\b(quay video|quay phim)\b/.test(text) && /\b(them|chon|bat)\b/.test(text)) {
    const rows = context.checklistRows
    if (!rows || rows.length === 0) {
      return {
        handled: true,
        satisfied: false,
        canVerify: false,
        explanation: 'Chưa thể kiểm tra tùy chọn quay video vì checklist của dịch vụ chưa sẵn sàng.',
      }
    }
    const supportsVideo = rows.some((r) => r.selected && (r.includedVideoCount > 0 || r.requiredEvidenceType !== 'IMAGE'))
    if (supportsVideo) {
      return {
        handled: true,
        satisfied: true,
        canVerify: true,
        explanation: 'Checklist hiện tại có hỗ trợ quay video, đang thêm quay video.',
        recommendedAction: { type: 'checklist_set_videos', count: 1 },
      }
    }
    return {
      handled: true,
      satisfied: false,
      canVerify: true,
      explanation: 'Các hạng mục checklist đang chọn không hỗ trợ quay video nên tôi chưa thêm.',
    }
  }

  // 4. "Nếu checklist này không bắt buộc thì bỏ đi"
  if (/\bchecklist\b/.test(text) && /\bkhong bat buoc\b/.test(text) && /\b(bo|xoa)\b/.test(text)) {
    const rows = context.checklistRows
    if (!rows || rows.length === 0) {
      return {
        handled: true,
        satisfied: false,
        canVerify: false,
        explanation: 'Chưa thể kiểm tra tính bắt buộc vì checklist chưa tải xong.',
      }
    }
    const optionalSelected = rows.filter((r) => r.selected && r.packageItem === false)
    if (optionalSelected.length > 0) {
      return {
        handled: true,
        satisfied: true,
        canVerify: true,
        explanation: `Có ${optionalSelected.length} mục bổ sung không bắt buộc, đang bỏ chọn.`,
        recommendedAction: { type: 'checklist_clear_optional' },
      }
    }
    return {
      handled: true,
      satisfied: false,
      canVerify: true,
      explanation: 'Không có mục checklist bổ sung nào ngoài gói bắt buộc để bỏ.',
    }
  }

  return null
}

/**
 * Inspect the current draft against real platform validation rules and return
 * actionable issues + 1 concise proactive next hint.
 */
export function validateDraftSmart(
  form: FormState,
  options: { today: string; checklistValid?: boolean },
): { issues: DraftIssue[]; proactiveNextHint: string | null } {
  const issues: DraftIssue[] = []
  const minDate = addDaysIso(options.today, BUSINESS_RULES.minScheduleLeadDays)

  if (!form.serviceId) {
    issues.push({ field: 'serviceId', step: 1, severity: 'missing', message: 'chọn dịch vụ' })
  }
  if (!form.flightPurpose) {
    issues.push({ field: 'flightPurpose', step: 1, severity: 'missing', message: 'mục đích bay' })
  }
  if (form.locationStatus !== 'confirmed' || !form.coverageArea) {
    issues.push({ field: 'location', step: 2, severity: 'missing', message: 'khu vực giám sát trên bản đồ' })
  }
  if (options.checklistValid === false) {
    issues.push({ field: 'checklist', step: 3, severity: 'missing', message: 'hạng mục checklist' })
  }
  if (!Number.isFinite(form.altitudeM) || form.altitudeM < ALTITUDE_MIN || form.altitudeM > ALTITUDE_MAX) {
    issues.push({
      field: 'altitudeM',
      step: 4,
      severity: 'error',
      message: `độ cao bay phải từ ${ALTITUDE_MIN}m đến ${ALTITUDE_MAX}m`,
    })
  }
  if (!form.siteContactName.trim() || !form.siteContactPhone.trim()) {
    issues.push({ field: 'contact', step: 4, severity: 'missing', message: 'thông tin liên hệ hiện trường' })
  } else if (!BUSINESS_RULES.phonePattern.test(form.siteContactPhone.trim())) {
    issues.push({ field: 'siteContactPhone', step: 4, severity: 'error', message: 'số điện thoại liên hệ chưa hợp lệ' })
  }
  if (!form.preferredDateFrom || !form.preferredDateTo) {
    issues.push({ field: 'schedule', step: 5, severity: 'missing', message: 'lịch bay dự kiến' })
  } else if (form.preferredDateFrom < minDate) {
    issues.push({
      field: 'preferredDateFrom',
      step: 5,
      severity: 'error',
      message: `ngày bay cần cách hôm nay ít nhất ${BUSINESS_RULES.minScheduleLeadDays} ngày (từ ${minDate})`,
    })
  } else if (form.preferredDateFrom > form.preferredDateTo) {
    issues.push({ field: 'preferredDateTo', step: 5, severity: 'error', message: 'ngày kết thúc phải sau ngày bắt đầu' })
  }
  if (!form.preferredTimeId) {
    issues.push({ field: 'preferredTimeId', step: 5, severity: 'missing', message: 'khung giờ bay' })
  }
  if (!form.deliverableTypeId || !form.termsAccepted) {
    issues.push({ field: 'review', step: 6, severity: 'missing', message: 'kết quả bàn giao & xác nhận điều khoản' })
  }

  const firstError = issues.find((i) => i.severity === 'error')
  if (firstError) {
    return { issues, proactiveNextHint: `Lưu ý: ${firstError.message}.` }
  }
  const missing = issues.filter((i) => i.severity === 'missing')
  if (!missing.length) {
    return { issues, proactiveNextHint: 'Bản nháp đã đủ thông tin chính, anh/chị có thể xem lại và gửi yêu cầu.' }
  }
  const topTwo = missing.slice(0, 2).map((i) => i.message).join(', ')
  return { issues, proactiveNextHint: `Hiện còn thiếu ${topTwo}.` }
}
