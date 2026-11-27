/**
 * AI Autonomous Action Agent V3 — Business Awareness, Action Planning & Self-Verification Runtime.
 *
 * Composes `businessKnowledge.ts` (real platform rules, pricing Q&A, smart recommendations,
 * conditional evaluation, Vietnamese relative dates, smart draft validation) with
 * `orderActionAgent.ts` inside a bounded EXECUTE -> OBSERVE -> VERIFY -> RECOVER loop.
 */
import { env } from '../../../../config/env'
import { isInsideHcmcServiceArea } from '../../../../shared/lib/serviceArea'
import type {
  PreferredTimeOption,
  ServiceOption,
  ServicePricingEstimate,
} from '../../api/customerApi'
import type { ChecklistRow } from '../checklist/types'
import {
  answerPricingQuestion,
  BUSINESS_RULES,
  evaluateConditionalRequest,
  matchPreferredTimeOption,
  parseVietnameseRelativeDate,
  recommendServiceForGoal,
  validateDraftSmart,
  type AccountContact,
} from './businessKnowledge'
import {
  executeFormActions,
  parseUtterance,
  type ActionResult,
  type AgentAction,
  type ExecutionContext,
  type ParseContext,
} from './orderActionAgent'
import type { FlightPurpose, FormState, Step } from './types'

export type AutonomousV3Action =
  | AgentAction
  | { type: 'query_pricing'; question: string }
  | { type: 'recommend_service'; goal: string }
  | { type: 'use_account_contact' }
  | { type: 'checklist_clear_optional' }
  | { type: 'set_time_slot'; preferredTimeId: string }
  | { type: 'show_draft' }

export type AutonomousPlan = {
  actions: AutonomousV3Action[]
  clarification?: string
  /** True when the turn is fully handled locally by V3 business intelligence. */
  handledLocally: boolean
}

export type AutonomousContext = ParseContext & {
  services: ServiceOption[]
  preferredTimes?: PreferredTimeOption[]
  pricingEstimate?: ServicePricingEstimate | null
  checklistRows?: ChecklistRow[]
  accountContact?: AccountContact
  checklistValid?: boolean
  purposeLabels: Record<FlightPurpose, string>
}

export type VerifiedStepOutcome = {
  action: AutonomousV3Action
  ok: boolean
  verified: boolean
  retried: boolean
  message: string
}

export type AutonomousLoopResult = {
  form: FormState
  outcomes: VerifiedStepOutcome[]
  reply: string
  proactiveHint: string | null
  searchQuery?: string
}

export type LocationSearchOutcome = {
  ok: boolean
  latitude?: number
  longitude?: number
  displayName?: string
  insideServiceArea?: boolean
  message: string
}

const MAX_SAFE_RETRIES = 1
const NON_IDEMPOTENT = new Set<string>(['submit', 'confirm_submit', 'reset', 'undo', 'redo'])

function normalizeText(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Stage 1 & 2: UNDERSTAND & PLAN.
 * Evaluates V3 business intelligence (conditional rules, pricing Q&A, smart recommendations,
 * account contact auto-fill, Vietnamese relative dates with 7-day lead-time enforcement,
 * and multi-intent plans) before delegating standard form/navigation actions to `parseUtterance`.
 */
export function planAutonomousTurn(raw: string, context: AutonomousContext): AutonomousPlan {
  const original = raw.trim()
  if (!original) return { actions: [], handledLocally: false }
  const text = normalizeText(original)
  const today = context.today ?? new Date().toISOString().slice(0, 10)
  const selectedService = context.services.find((s) => s.id === context.memory?.currentServiceId)

  // 1. Conditional requests ("Nếu dịch vụ này dưới 3 triệu thì chọn", "Nếu sáng mai còn lịch...")
  if (/\bneu\b/.test(text)) {
    const cond = evaluateConditionalRequest(original, {
      services: context.services,
      selectedService,
      preferredTimes: context.preferredTimes,
      checklistRows: context.checklistRows,
      today,
    })
    if (cond?.handled) {
      if (cond.satisfied && cond.canVerify && cond.recommendedAction) {
        const rec = cond.recommendedAction
        if (rec.type === 'select_service') {
          return { actions: [{ type: 'select_service', serviceId: rec.serviceId }], handledLocally: true }
        }
        if (rec.type === 'checklist_set_videos') {
          return { actions: [{ type: 'checklist_set_videos', count: rec.count }], handledLocally: true }
        }
        if (rec.type === 'checklist_clear_optional') {
          return { actions: [{ type: 'checklist_clear_optional' }], handledLocally: true }
        }
      }
      return { actions: [], clarification: cond.explanation, handledLocally: true }
    }
  }

  // 2. Pricing Q&A ("Giá bao nhiêu?", "Có dịch vụ nào rẻ hơn không?", "Thêm quay video có tăng giá không?")
  if (/\b(gia bao nhieu|bao nhieu tien|re hon|tang gia|con bao nhieu|bao gia)\b/.test(text)) {
    return {
      actions: [{ type: 'query_pricing', question: original }],
      handledLocally: true,
    }
  }

  // 3. Show current draft summary
  if (/\b(xem ban nhap|xem lai ban nhap|xem thong tin da dien)\b/.test(text)) {
    return { actions: [{ type: 'show_draft' }], handledLocally: true }
  }

  // 4. Smart service recommendation ONLY when no service is selected yet and the user is not asking a HOW/WHAT/CAN/HOW_LONG question
  const isConsultationHowWhat =
    /\b(nhu the nao|kieu gi|lam sao|bao lau|co ro khong|co chinh sua|file goc|khong phai y toi|y toi la|y coi la)\b/.test(
      text,
    ) || /\?$/.test(original)
  if (!selectedService && !isConsultationHowWhat) {
    const rec = recommendServiceForGoal(original, context.services)
    if (rec && !rec.shouldAutoSelect) {
      return {
        actions: [{ type: 'recommend_service', goal: original }],
        handledLocally: true,
      }
    }
  }

  // 5. Delegate core parsing to orderActionAgent and augment with V3 multi-intent capabilities
  const base = parseUtterance(original, context)
  const actions: AutonomousV3Action[] = [...base.actions]
  let clarification = base.clarification

  // 5a. Account contact auto-fill ("thông tin liên hệ lấy từ tài khoản")
  if (/\b(lay tu tai khoan|thong tin tai khoan|dung tai khoan|tu tai khoan)\b/.test(text)) {
    actions.push({ type: 'use_account_contact' })
  }

  // 5b. Relative Vietnamese dates + 7-day lead-time rule + time slot matching
  const relDate = parseVietnameseRelativeDate(original, today)
  const matchedTime = matchPreferredTimeOption(original, context.preferredTimes ?? [])
  if (relDate && /\b(bay|lich|sang|chieu|toi|gio)\b/.test(text)) {
    // Remove any unverified too-soon schedule action emitted by base parser
    const filtered = actions.filter((a) => a.type !== 'set_schedule')
    actions.length = 0
    actions.push(...filtered)
    if (relDate.meetsLeadTime) {
      actions.push({
        type: 'set_schedule',
        dateFrom: relDate.dateIso,
        dateTo: relDate.dateIso,
        ...(matchedTime ? { preferredTimeId: matchedTime.id } : {}),
      })
    } else {
      clarification = `Chưa thể đặt lịch ${relDate.label} (${relDate.dateIso}) vì hệ thống yêu cầu đặt trước tối thiểu ${BUSINESS_RULES.minScheduleLeadDays} ngày (từ ${relDate.earliestAllowedDate} trở đi).`
    }
  } else if (
    matchedTime &&
    /\b(bay|lich|gio|khung gio)\b/.test(text) &&
    !actions.some((a) => a.type === 'set_schedule')
  ) {
    actions.push({ type: 'set_time_slot', preferredTimeId: matchedTime.id })
  }

  // 5c. Natural Vietnamese informal photo/video phrases ("quay phim luôn nha", "thêm cái chụp hình vô", "không cần quay nữa")
  if (/\bkhong can quay nua\b/.test(text) && !actions.some((a) => a.type === 'checklist_set_videos')) {
    actions.push({ type: 'checklist_set_videos', count: 0 })
  } else if (
    /\b(quay phim luon|quay video luon)\b/.test(text) &&
    !actions.some((a) => a.type === 'checklist_set_videos')
  ) {
    actions.push({ type: 'checklist_set_videos', count: 1 })
  }
  if (
    /\b(them cai chup hinh|chup hinh vo|can chup anh|them chup anh)\b/.test(text) &&
    !actions.some((a) => a.type === 'checklist_set_images')
  ) {
    actions.push({ type: 'checklist_set_images', count: 1 })
  }

  return {
    actions,
    clarification,
    handledLocally: actions.length > 0 || Boolean(clarification),
  }
}

/**
 * Stage 5 & 6: OBSERVE & VERIFY post-execution state against expected state.
 * Returns null if verified, or mismatch explanation if state did not match expectation.
 */
export function verifyPostState(action: AutonomousV3Action, actual: FormState): string | null {
  switch (action.type) {
    case 'select_service':
      return actual.serviceId === action.serviceId
        ? null
        : `Kỳ vọng serviceId="${action.serviceId}" nhưng thực tế là "${actual.serviceId}".`
    case 'clear_service':
      return actual.serviceId === '' ? null : 'Dịch vụ hiện tại chưa được bỏ chọn.'
    case 'set_flight_purpose':
      return actual.flightPurpose === action.purpose
        ? null
        : `Kỳ vọng mục đích "${action.purpose}" nhưng thực tế là "${actual.flightPurpose}".`
    case 'set_description':
      return actual.description === action.text ? null : 'Mô tả nhiệm vụ chưa cập nhật đúng.'
    case 'set_contact':
      if (action.name && actual.siteContactName !== action.name) return 'Tên người liên hệ chưa khớp.'
      if (action.phone && actual.siteContactPhone !== action.phone) return 'Số điện thoại liên hệ chưa khớp.'
      return null
    case 'set_schedule':
      if (action.dateFrom && actual.preferredDateFrom !== action.dateFrom) return 'Ngày bắt đầu bay chưa khớp.'
      if (action.dateTo && actual.preferredDateTo !== action.dateTo) return 'Ngày kết thúc bay chưa khớp.'
      return null
    case 'set_time_slot':
      return actual.preferredTimeId === action.preferredTimeId ? null : 'Khung giờ bay chưa khớp.'
    default:
      return null
  }
}

/**
 * Stages 3–8: VALIDATE -> EXECUTE -> OBSERVE -> VERIFY -> RECOVER -> RESPOND.
 * Executes actions with bounded safe retry (max 1 retry for idempotent mutations),
 * never retries non-idempotent actions, and never reports success when state verification fails.
 */
export function runVerifiedExecutionLoop(
  initialForm: FormState,
  plan: AutonomousPlan,
  context: AutonomousContext & {
    handlers: ExecutionContext['handlers'] & {
      checklistClearOptional?: () => number | null
      onSearchLocation?: (query: string) => void
    }
    /** Optional state observer (for runtime or test fault injection). */
    observeState?: (form: FormState, action: AutonomousV3Action, attempt: number) => FormState
  },
): AutonomousLoopResult {
  let current = initialForm
  const outcomes: VerifiedStepOutcome[] = []
  const today = context.today ?? new Date().toISOString().slice(0, 10)
  const observe = context.observeState ?? ((f: FormState) => f)
  let searchQuery: string | undefined

  for (const action of plan.actions) {
    // Handle V3-specific actions directly
    if (action.type === 'query_pricing') {
      const selectedService = context.services.find((s) => s.id === current.serviceId)
      const answer = answerPricingQuestion(action.question, {
        services: context.services,
        selectedService,
        pricingEstimate: context.pricingEstimate,
        checklistRows: context.checklistRows,
      })
      outcomes.push({
        action,
        ok: true,
        verified: true,
        retried: false,
        message: answer ?? 'Chưa có dữ liệu giá cho câu hỏi này; quản lý sẽ gửi báo giá chính thức sau khi tiếp nhận yêu cầu.',
      })
      continue
    }

    if (action.type === 'recommend_service') {
      const rec = recommendServiceForGoal(action.goal, context.services)
      outcomes.push({
        action,
        ok: Boolean(rec),
        verified: true,
        retried: false,
        message: rec
          ? `${rec.reason} Anh/chị có muốn tôi chọn gói này không?`
          : 'Hiện chưa tìm thấy dịch vụ khớp trực tiếp trong danh mục; anh/chị có thể chọn từ danh sách dịch vụ.',
      })
      continue
    }

    if (action.type === 'show_draft') {
      const { proactiveNextHint } = validateDraftSmart(current, { today, checklistValid: context.checklistValid })
      const serviceName = context.services.find((s) => s.id === current.serviceId)?.name ?? 'Chưa chọn'
      const purposeName = current.flightPurpose ? context.purposeLabels[current.flightPurpose] : 'Chưa chọn'
      outcomes.push({
        action,
        ok: true,
        verified: true,
        retried: false,
        message: `Bản nháp hiện tại: Dịch vụ ${serviceName}; Mục đích ${purposeName}.${proactiveNextHint ? ` ${proactiveNextHint}` : ''}`,
      })
      continue
    }

    if (action.type === 'use_account_contact') {
      const name = context.accountContact?.fullName?.trim()
      const phone = context.accountContact?.phone?.trim()
      if (!name && !phone) {
        outcomes.push({
          action,
          ok: false,
          verified: false,
          retried: false,
          message: 'Tài khoản hiện chưa có sẵn họ tên hoặc số điện thoại liên hệ; anh/chị vui lòng cung cấp giúp tôi nhé.',
        })
        continue
      }
      const contactMutation: AgentAction = {
        type: 'set_contact',
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
      }
      current = {
        ...current,
        ...(name ? { siteContactName: name } : {}),
        ...(phone ? { siteContactPhone: phone } : {}),
      }
      const observed = observe(current, contactMutation, 0)
      const mismatch = verifyPostState(contactMutation, observed)
      current = observed
      outcomes.push({
        action,
        ok: !mismatch,
        verified: !mismatch,
        retried: false,
        message: mismatch
          ? `Không xác minh được thông tin liên hệ (${mismatch}).`
          : `Đã điền liên hệ từ tài khoản (${[name, phone].filter(Boolean).join(' - ')}).`,
      })
      continue
    }

    if (action.type === 'checklist_clear_optional') {
      const changed = current.serviceId ? context.handlers.checklistClearOptional?.() ?? null : null
      outcomes.push({
        action,
        ok: changed !== null,
        verified: changed !== null,
        retried: false,
        message: changed === null
          ? 'Checklist chưa sẵn sàng để bỏ các mục bổ sung.'
          : `Đã bỏ ${changed} mục bổ sung không bắt buộc, giữ nguyên hạng mục trong gói.`,
      })
      continue
    }

    if (action.type === 'set_time_slot') {
      current = { ...current, preferredTimeId: action.preferredTimeId }
      const observed = observe(current, action, 0)
      const mismatch = verifyPostState(action, observed)
      current = observed
      outcomes.push({
        action,
        ok: !mismatch,
        verified: !mismatch,
        retried: false,
        message: mismatch ? `Chưa xác minh được khung giờ (${mismatch}).` : 'Đã cập nhật khung giờ bay dự kiến.',
      })
      continue
    }

    // Track real location search query for async geocoding in OrderConversation
    if (action.type === 'search_location' && 'query' in action) {
      searchQuery = action.query
      context.handlers.onSearchLocation?.(action.query)
    }

    // Validate 7-day lead time before delegating set_schedule
    if (action.type === 'set_schedule' && action.dateFrom) {
      const earliest = new Date(today + 'T00:00:00Z')
      earliest.setUTCDate(earliest.getUTCDate() + BUSINESS_RULES.minScheduleLeadDays)
      const earliestIso = earliest.toISOString().slice(0, 10)
      if (action.dateFrom < earliestIso) {
        outcomes.push({
          action,
          ok: false,
          verified: false,
          retried: false,
          message: `Ngày bay ${action.dateFrom} chưa đủ thời gian chuẩn bị tối thiểu ${BUSINESS_RULES.minScheduleLeadDays} ngày (sớm nhất từ ${earliestIso}).`,
        })
        continue
      }
    }

    // Bounded EXECUTE -> OBSERVE -> VERIFY -> RECOVER loop for core AgentActions
    let attempt = 0
    let finalOutcome: VerifiedStepOutcome | null = null
    while (attempt <= MAX_SAFE_RETRIES) {
      const { form: nextForm, results } = executeFormActions(current, [action as AgentAction], {
        services: context.services,
        purposeLabels: context.purposeLabels,
        handlers: context.handlers,
      })
      const stepRes: ActionResult | undefined = results[0]
      const observed = observe(nextForm, action, attempt)
      const mismatch = stepRes?.ok ? verifyPostState(action, observed) : null

      if (!mismatch) {
        current = observed
        finalOutcome = {
          action,
          ok: Boolean(stepRes?.ok),
          verified: Boolean(stepRes?.ok),
          retried: attempt > 0,
          message: stepRes?.message ?? 'Đã thực hiện.',
        }
        break
      }

      if (NON_IDEMPOTENT.has(action.type) || attempt >= MAX_SAFE_RETRIES) {
        current = observed
        finalOutcome = {
          action,
          ok: false,
          verified: false,
          retried: attempt > 0,
          message: `Không xác minh được thay đổi (${mismatch}) nên trợ lý chưa xác nhận thành công.`,
        }
        break
      }
      attempt += 1
    }

    if (finalOutcome) outcomes.push(finalOutcome)
  }

  const { proactiveNextHint } = validateDraftSmart(current, {
    today,
    checklistValid: context.checklistValid,
  })

  const parts = outcomes.map((o) => o.message)
  if (plan.clarification) parts.push(plan.clarification)
  const mutated = outcomes.some(
    (o) =>
      o.ok &&
      [
        'select_service',
        'set_flight_purpose',
        'set_contact',
        'use_account_contact',
        'set_schedule',
        'checklist_set_videos',
        'checklist_set_images',
      ].includes(o.action.type),
  )
  if (
    mutated &&
    !plan.clarification &&
    proactiveNextHint &&
    !parts.some((p) => p.includes('Hiện còn thiếu') || p.includes('Lưu ý:'))
  ) {
    parts.push(proactiveNextHint)
  }

  return {
    form: current,
    outcomes,
    reply: parts.join(' ').trim(),
    proactiveHint: proactiveNextHint,
    searchQuery,
  }
}

/**
 * Real Geocoding lookup using the platform's `/api/geocoding/search` endpoint.
 * Never fabricates coordinates or draws unverified flight boundaries.
 */
export async function searchLocationAddress(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LocationSearchOutcome> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { ok: false, message: 'Vui lòng cung cấp địa chỉ cụ thể để tìm trên bản đồ.' }
  }
  try {
    const params = new URLSearchParams({ q: trimmed })
    const response = await fetchImpl(`${env.apiBaseUrl}/api/geocoding/search?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    })
    const payload = (await response.json().catch(() => null)) as {
      success?: boolean
      message?: string
      data?: { latitude?: number; longitude?: number; displayName?: string }
    } | null
    if (!response.ok || payload?.success === false || !payload?.data) {
      return {
        ok: false,
        message: `Chưa tìm thấy địa điểm "${trimmed}" trên bản đồ. Anh/chị vui lòng nhập rõ hơn hoặc chọn trực tiếp trên bản đồ.`,
      }
    }
    const lat = Number(payload.data.latitude)
    const lng = Number(payload.data.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return {
        ok: false,
        message: `Địa điểm "${trimmed}" chưa có tọa độ hợp lệ. Anh/chị vui lòng chọn trực tiếp trên bản đồ.`,
      }
    }
    const inside = isInsideHcmcServiceArea({ latitude: lat, longitude: lng })
    const displayName = payload.data.displayName?.trim() || trimmed
    if (!inside) {
      return {
        ok: false,
        latitude: lat,
        longitude: lng,
        displayName,
        insideServiceArea: false,
        message: `Đã tìm thấy "${displayName}" nhưng vị trí này nằm ngoài phạm vi phục vụ ${BUSINESS_RULES.serviceAreaLabel}.`,
      }
    }
    return {
      ok: true,
      latitude: lat,
      longitude: lng,
      displayName,
      insideServiceArea: true,
      message: `Đã định vị "${displayName}" trên bản đồ. Anh/chị vui lòng vẽ hoặc xác nhận ranh giới vùng giám sát trên bản đồ (trợ lý không tự vẽ ranh giới bay).`,
    }
  } catch {
    return {
      ok: false,
      message: `Không kết nối được dịch vụ tìm kiếm địa chỉ cho "${trimmed}". Anh/chị có thể tìm trực tiếp trong bước bản đồ.`,
    }
  }
}
