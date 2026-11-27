import { describe, expect, it, vi } from 'vitest'
import type { ServiceOption, ServicePricingEstimate, PreferredTimeOption } from '../../api/customerApi'
import type { ChecklistRow } from '../checklist/types'
import { createDefaultForm } from './draftStorage'
import {
  answerPricingQuestion,
  evaluateConditionalRequest,
  parseVietnameseRelativeDate,
  recommendServiceForGoal,
  validateDraftSmart,
} from './businessKnowledge'
import {
  planAutonomousTurn,
  runVerifiedExecutionLoop,
  searchLocationAddress,
} from './autonomousAgentV3'

const services: ServiceOption[] = [
  {
    id: 'svc-build',
    name: 'Giám sát công trình',
    description: 'Theo dõi tiến độ thi công, hạ tầng và công trường bằng drone.',
    defaultPrice: 2_500_000,
    priceSource: 'CHECKLISTS',
    isActive: true,
  },
  {
    id: 'svc-factory',
    name: 'Kiểm tra nhà xưởng',
    description: 'Kiểm tra mái tôn, kết cấu nhà xưởng và khu công nghiệp.',
    defaultPrice: 3_800_000,
    priceSource: 'CHECKLISTS',
    isActive: true,
  },
  {
    id: 'svc-agri',
    name: 'Giám sát nông nghiệp',
    description: 'Theo dõi tình trạng cây trồng, mùa màng và tưới tiêu.',
    defaultPrice: 1_900_000,
    priceSource: 'CHECKLISTS',
    isActive: true,
  },
  {
    id: 'svc-forest',
    name: 'Giám sát rừng',
    description: 'Giám sát rừng và tài nguyên lâm nghiệp.',
    priceSource: 'UNPRICED',
    isActive: true,
  },
]

const preferredTimes: PreferredTimeOption[] = [
  { id: 'time-morning', code: 'MORNING', name: 'Buổi sáng (07:30 - 11:00)' },
  { id: 'time-afternoon', code: 'AFTERNOON', name: 'Buổi chiều (13:30 - 17:00)' },
]

const purposeLabels = {
  SURVEY_MONITORING: 'Khảo sát và đo đạc',
  AGRICULTURE: 'Nông nghiệp',
  CONSTRUCTION_MONITORING: 'Giám sát thi công',
  INDUSTRIAL_INSPECTION: 'Kiểm tra nhà xưởng',
  AREA_MONITORING: 'Giám sát khu vực',
  FOREST_MONITORING: 'Giám sát rừng',
  OTHER: 'Mục đích khác',
}

const sampleChecklistRows = [
  {
    key: 'row-1',
    name: 'Tổng quan công trình',
    selected: true,
    packageItem: true,
    requiredEvidenceType: 'IMAGE',
    includedImageCount: 5,
    includedVideoCount: 1,
    requestedImageCount: 5,
    requestedVideoCount: 0,
  },
  {
    key: 'row-2',
    name: 'Quét nhiệt mở rộng',
    selected: true,
    packageItem: false,
    requiredEvidenceType: 'IMAGE',
    includedImageCount: 2,
    includedVideoCount: 0,
    requestedImageCount: 2,
    requestedVideoCount: 0,
  },
] as unknown as ChecklistRow[]

describe('V3 Business Knowledge Layer', () => {
  it('phân tích ngày tương đối tiếng Việt và kiểm tra quy tắc đặt trước tối thiểu 7 ngày', () => {
    const tomorrow = parseVietnameseRelativeDate('Bay sáng mai tầm tám giờ', '2026-06-01')
    expect(tomorrow).toMatchObject({
      dateIso: '2026-06-02',
      timeSlotHint: 'MORNING',
      hour: 8,
      meetsLeadTime: false,
      earliestAllowedDate: '2026-06-08',
    })

    const nextFri = parseVietnameseRelativeDate('Thứ sáu tuần sau sau 3 giờ chiều', '2026-06-01')
    expect(nextFri).toMatchObject({
      dateIso: '2026-06-12',
      timeSlotHint: 'AFTERNOON',
      hour: 15,
      meetsLeadTime: true,
    })
  })

  it('gợi ý dịch vụ theo mục tiêu thực tế và không tự chọn khi khách chỉ hỏi tư vấn', () => {
    const recBuild = recommendServiceForGoal('Tôi muốn xem công trình xây tới đâu rồi', services)
    expect(recBuild?.service.id).toBe('svc-build')
    expect(recBuild?.shouldAutoSelect).toBe(false)

    const recFactory = recommendServiceForGoal('Tôi muốn kiểm tra mái nhà xưởng', services)
    expect(recFactory?.service.id).toBe('svc-factory')
    expect(recFactory?.shouldAutoSelect).toBe(false)

    const recAgri = recommendServiceForGoal('Tôi muốn theo dõi tình trạng cây trồng', services)
    expect(recAgri?.service.id).toBe('svc-agri')
    expect(recAgri?.shouldAutoSelect).toBe(false)
  })

  it('trả lời câu hỏi giá từ dữ liệu thật, phân biệt giá tham khảo / dự kiến / báo giá quản lý', () => {
    const estimate: ServicePricingEstimate = {
      serviceId: 'svc-build',
      servicePrice: 2_500_000,
      additionalRequirements: [{ type: 'CONTEXT_EXTRA_VIDEO', description: 'EXTRA_VIDEO', additionalPrice: 300_000 }],
      totalPrice: 2_800_000,
      quotePending: false,
      occurrences: 1,
    }
    const q1 = answerPricingQuestion('Giá bao nhiêu?', { services, selectedService: services[0], pricingEstimate: estimate })
    expect(q1).toMatch(/2\.800\.000|2,800,000/)
    expect(q1).toMatch(/dự kiến/i)
    expect(q1).toMatch(/quản lý/i)

    const q2 = answerPricingQuestion('Có dịch vụ nào rẻ hơn không?', { services, selectedService: services[0] })
    expect(q2).toContain('Giám sát nông nghiệp')

    const q3 = answerPricingQuestion('Thêm quay video có tăng giá không?', {
      services,
      selectedService: services[0],
      pricingEstimate: estimate,
      checklistRows: sampleChecklistRows,
    })
    expect(q3).toMatch(/300\.000|300,000/)
  })

  it('đánh giá yêu cầu có điều kiện bằng dữ liệu thật và không tự giả định khi không xác minh được', () => {
    const cheapOk = evaluateConditionalRequest('Nếu dịch vụ này dưới 3 triệu thì chọn', {
      services,
      selectedService: services[0],
      today: '2026-06-01',
    })
    expect(cheapOk?.satisfied).toBe(true)
    expect(cheapOk?.recommendedAction).toEqual({ type: 'select_service', serviceId: 'svc-build' })

    const tooExpensive = evaluateConditionalRequest('Nếu dịch vụ này dưới 3 triệu thì chọn', {
      services,
      selectedService: services[1],
      today: '2026-06-01',
    })
    expect(tooExpensive?.satisfied).toBe(false)

    const unpriced = evaluateConditionalRequest('Nếu dịch vụ này dưới 3 triệu thì chọn', {
      services,
      selectedService: services[3],
      today: '2026-06-01',
    })
    expect(unpriced?.canVerify).toBe(false)
    expect(unpriced?.satisfied).toBe(false)

    const tomorrowSlot = evaluateConditionalRequest('Nếu sáng mai còn lịch thì đặt lịch dự kiến lúc 8 giờ', {
      services,
      today: '2026-06-01',
    })
    expect(tomorrowSlot?.satisfied).toBe(false)
    expect(tomorrowSlot?.explanation).toContain('7 ngày')

    const optionalChecklist = evaluateConditionalRequest('Nếu checklist này không bắt buộc thì bỏ đi', {
      services,
      checklistRows: sampleChecklistRows,
      today: '2026-06-01',
    })
    expect(optionalChecklist?.satisfied).toBe(true)
    expect(optionalChecklist?.recommendedAction).toEqual({ type: 'checklist_clear_optional' })
  })

  it('phát hiện lỗi dữ liệu thông minh và đưa ra gợi ý mục còn thiếu tiếp theo', () => {
    const form = {
      ...createDefaultForm(),
      serviceId: 'svc-build',
      flightPurpose: 'CONSTRUCTION_MONITORING' as const,
      siteContactName: 'An',
      siteContactPhone: '123',
      preferredDateFrom: '2026-06-02',
      preferredDateTo: '2026-06-02',
    }
    const check = validateDraftSmart(form, { today: '2026-06-01', checklistValid: true })
    expect(check.issues.some((i) => i.field === 'siteContactPhone')).toBe(true)
    expect(check.issues.some((i) => i.field === 'preferredDateFrom')).toBe(true)
    expect(check.proactiveNextHint).toContain('Lưu ý:')
  })
})

describe('V3 Autonomous Action Planning & Execute-Observe-Verify-Recover Loop', () => {
  it('lập kế hoạch đa ý định: thực thi phần hợp lệ (dịch vụ, ảnh, video, liên hệ tài khoản, tìm vị trí) và chặn lịch vi phạm 7 ngày', () => {
    const checklistSetImages = vi.fn(() => 1)
    const checklistSetVideos = vi.fn(() => 1)
    const onSearchLocation = vi.fn()
    const openStep = vi.fn()

    const ctx = {
      services,
      preferredTimes,
      checklistRows: sampleChecklistRows,
      accountContact: { fullName: 'Trần Văn B', phone: '0987654321', email: 'b@example.com' },
      purposeLabels,
      today: '2026-06-01',
      checklistValid: true,
    }

    const utterance =
      'Tôi muốn giám sát tiến độ công trình ở Đại học FPT HCM, cần chụp ảnh, quay video, bay sáng mai lúc 8 giờ, thông tin liên hệ lấy từ tài khoản.'
    const plan = planAutonomousTurn(utterance, ctx)
    expect(plan.handledLocally).toBe(true)
    expect(plan.clarification).toContain('7 ngày')

    const initial = { ...createDefaultForm(), preferredDateFrom: '', preferredDateTo: '' }
    const res = runVerifiedExecutionLoop(initial, plan, {
      ...ctx,
      handlers: { checklistSetImages, checklistSetVideos, onSearchLocation, openStep },
    })

    expect(res.form.serviceId).toBe('svc-build')
    expect(res.form.siteContactName).toBe('Trần Văn B')
    expect(res.form.siteContactPhone).toBe('0987654321')
    expect(res.form.preferredDateFrom).toBe('')
    expect(checklistSetImages).toHaveBeenCalledWith(1)
    expect(checklistSetVideos).toHaveBeenCalledWith(1)
    expect(res.reply).toContain('7 ngày')
  })

  it('Execute-Observe-Verify-Recover: phát hiện sai lệch trạng thái (kỳ vọng svc-build, thực tế svc-factory), retry giới hạn 1 lần và không báo thành công nếu vẫn lệch', () => {
    const ctx = {
      services,
      purposeLabels,
      today: '2026-06-01',
    }
    const plan = planAutonomousTurn('Chọn dịch vụ giám sát công trình', ctx)
    let observeCalls = 0
    const res = runVerifiedExecutionLoop(createDefaultForm(), plan, {
      ...ctx,
      handlers: {},
      observeState: (form) => {
        observeCalls += 1
        // Simulate persistent unexpected state mismatch (stuck on svc-factory)
        return { ...form, serviceId: 'svc-factory' }
      },
    })

    // Initial attempt + MAX_SAFE_RETRIES (1) = 2 bounded attempts, never infinite loop
    expect(observeCalls).toBe(2)
    expect(res.outcomes[0].ok).toBe(false)
    expect(res.outcomes[0].verified).toBe(false)
    expect(res.outcomes[0].retried).toBe(true)
    expect(res.reply).toContain('chưa xác nhận thành công')
    expect(res.reply).not.toContain('Đã chọn dịch vụ')
  })

  it('searchLocationAddress gọi API geocoding thật và không bịa tọa độ hay ranh giới bay', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          latitude: 10.8411276,
          longitude: 106.809883,
          displayName: 'Đại học FPT TP.HCM, Khu Công nghệ cao, TP. Thủ Đức',
        },
      }),
    })
    const outcome = await searchLocationAddress('Đại học FPT HCM', mockFetch as unknown as typeof fetch)
    expect(outcome.ok).toBe(true)
    expect(outcome.insideServiceArea).toBe(true)
    expect(outcome.displayName).toContain('Đại học FPT')
    expect(outcome.message).toContain('không tự vẽ ranh giới')
  })
})
