import { describe, expect, it, vi } from 'vitest'
import { createDefaultForm } from './draftStorage'
import {
  DraftHistory,
  executeFormActions,
  normalizeSpokenEmail,
  normalizeSpokenPhone,
  parseUtterance,
  submitOnce,
  type ExecutionContext,
  type PreferredTimeCatalogItem,
} from './orderActionAgent'
import { requestInfoPanelMessages } from '../../pages/CreateOrder/components/RequestInfoPanel.messages'

const SERVICES = [
  { id: 'svc-build', name: 'Giám sát công trình', isActive: true },
  { id: 'svc-factory', name: 'Kiểm tra nhà xưởng', isActive: true },
  { id: 'svc-forest', name: 'Giám sát rừng', isActive: true },
]

const TIMES: PreferredTimeCatalogItem[] = [
  { id: 'time-morning', name: 'Buổi sáng', startTime: '07:00', endTime: '11:30' },
  { id: 'time-afternoon', name: 'Buổi chiều', startTime: '13:00', endTime: '17:30' },
]

const ctx = (handlers: ExecutionContext['handlers'] = {}): ExecutionContext => ({
  services: SERVICES,
  purposeLabels: requestInfoPanelMessages.vi.flightPurposes,
  handlers: { preferredTimes: TIMES, ...handlers },
})

describe('AI Chatbot V5 — Universal Voice-to-Field Engine', () => {
  it('1. resolves natural flight purpose without requiring the words "mục đích"', () => {
    const plan = parseUtterance('Tôi muốn theo dõi tiến độ xây dựng', {
      services: SERVICES,
      memory: { activeSection: 'purpose' },
    })
    expect(plan.actions).toContainEqual({
      type: 'set_flight_purpose',
      purpose: 'CONSTRUCTION_MONITORING',
    })
  })

  it('2. populates actual mission description directly and supports full editing suite', () => {
    const start = { ...createDefaultForm(), serviceId: 'svc-build', flightPurpose: 'CONSTRUCTION_MONITORING' as const }
    const p1 = parseUtterance(
      'Tôi muốn quay toàn cảnh tòa nhà, kiểm tra mái và ghi nhận tiến độ thi công.',
      { services: SERVICES, memory: { activeSection: 'description' } },
    )
    const r1 = executeFormActions(start, p1.actions, ctx())
    expect(r1.form.description).toContain('quay toàn cảnh tòa nhà')

    // Append
    const p2 = parseUtterance('Thêm kiểm tra hệ thống thoát nước vào mô tả', {
      services: SERVICES,
      memory: { activeSection: 'description' },
    })
    const r2 = executeFormActions(r1.form, p2.actions, ctx())
    expect(r2.form.description).toContain('kiểm tra hệ thống thoát nước')

    // Remove phrase
    const p3 = parseUtterance('Bỏ phần kiểm tra mái đi', {
      services: SERVICES,
      memory: { activeSection: 'description' },
    })
    const r3 = executeFormActions(r2.form, p3.actions, ctx())
    expect(r3.form.description.toLowerCase()).not.toContain('kiểm tra mái')

    // Read back
    const pRead = parseUtterance('Đọc lại mô tả cho tôi nghe', { services: SERVICES })
    const rRead = executeFormActions(r3.form, pRead.actions, ctx())
    expect(rRead.results[0].message).toContain('Mô tả hiện tại:')

    // Clear
    const pClear = parseUtterance('Xóa mô tả', { services: SERVICES })
    const rClear = executeFormActions(r3.form, pClear.actions, ctx())
    expect(rClear.form.description).toBe('')
  })

  it('3. automates 4-stage description refinement commands (evaluate, clarify, improve, apply)', () => {
    expect(
      parseUtterance('Mô tả như vậy có ổn không?', { services: SERVICES }).actions,
    ).toContainEqual({ type: 'evaluate_description' })

    expect(
      parseUtterance('Theo dõi tiến độ thi công hàng tuần', {
        services: SERVICES,
        memory: { activeSection: 'description', hasActiveDescriptionQuestion: true },
      }).actions,
    ).toContainEqual({
      type: 'clarify_description',
      answer: 'Theo dõi tiến độ thi công hàng tuần',
    })

    expect(
      parseUtterance('Viết mô tả chuyên nghiệp hơn', { services: SERVICES }).actions,
    ).toContainEqual({ type: 'improve_description', mode: 'professional' })

    expect(
      parseUtterance('Rút gọn mô tả', { services: SERVICES }).actions,
    ).toContainEqual({ type: 'improve_description', mode: 'shorten' })

    expect(
      parseUtterance('Được rồi, áp dụng đi', {
        services: SERVICES,
        memory: { activeSection: 'description', hasGeneratedDescription: true },
      }).actions,
    ).toContainEqual({ type: 'apply_description' })
  })

  it('4. extracts location search query without fabricating coordinates and supports clearing area', () => {
    const locPlan = parseUtterance('Tại Đại học FPT cơ sở HCM', { services: SERVICES })
    expect(locPlan.actions).toContainEqual({
      type: 'search_location',
      query: 'Đại học FPT cơ sở HCM',
    })

    const clearPlan = parseUtterance('Xóa vùng giám sát', { services: SERVICES })
    const start = {
      ...createDefaultForm(),
      coverageAreaShape: 'POLYGON' as const,
      coverageArea: { type: 'Polygon' as const, coordinates: [[[106.8, 10.8], [106.81, 10.8], [106.81, 10.81], [106.8, 10.8]]] as never },
    }
    const res = executeFormActions(start, clearPlan.actions, ctx())
    expect(res.form.coverageArea).toBeNull()
  })

  it('5. controls checklist items (images+video, mandatory only, ordinal toggle)', () => {
    const mandatory = vi.fn(() => 2)
    const toggle = vi.fn(() => 1)
    const setImages = vi.fn(() => 2)
    const setVideos = vi.fn(() => 2)
    const base = { ...createDefaultForm(), serviceId: 'svc-build' }

    executeFormActions(
      base,
      parseUtterance('Chụp ảnh và quay video', { services: SERVICES }).actions,
      ctx({ checklistSetImages: setImages, checklistSetVideos: setVideos }),
    )
    expect(setImages).toHaveBeenCalledWith(3)
    expect(setVideos).toHaveBeenCalledWith(1)

    executeFormActions(
      base,
      parseUtterance('Chỉ lấy những mục bắt buộc', { services: SERVICES }).actions,
      ctx({ checklistSelectMandatoryOnly: mandatory }),
    )
    expect(mandatory).toHaveBeenCalledOnce()

    executeFormActions(
      base,
      parseUtterance('Chọn mục thứ hai', {
        services: SERVICES,
        memory: { activeSection: 'checklist' },
      }).actions,
      ctx({ checklistToggleItem: toggle }),
    )
    expect(toggle).toHaveBeenCalledWith(1, undefined, true)
  })

  it('6. normalizes spoken Vietnamese phone numbers, emails, and account contact autofill', () => {
    expect(
      normalizeSpokenPhone('không chín không một hai ba bốn năm sáu bảy'),
    ).toBe('0901234567')
    expect(normalizeSpokenEmail('example a còng gmail chấm com')).toBe('example@gmail.com')

    const pContact = parseUtterance(
      'Tôi tên Nguyễn Văn A, số điện thoại 0901234567, email là example@example.com',
      { services: SERVICES },
    )
    const res = executeFormActions(createDefaultForm(), pContact.actions, ctx())
    expect(res.form.siteContactName).toBe('Nguyễn Văn A')
    expect(res.form.siteContactPhone).toBe('0901234567')
    expect(res.form.accessNotes).toContain('example@example.com')

    const pAuto = parseUtterance('Lấy thông tin từ tài khoản của tôi', { services: SERVICES })
    const rAuto = executeFormActions(
      createDefaultForm(),
      pAuto.actions,
      ctx({
        getAccountContact: () => ({ name: 'Trần Minh', phone: '0988777666' }),
      }),
    )
    expect(rAuto.form.siteContactName).toBe('Trần Minh')
    expect(rAuto.form.siteContactPhone).toBe('0988777666')
  })

  it('7. parses relative Vietnamese dates, time slots, and date shifts', () => {
    const p1 = parseUtterance('Bay sáng mai lúc 8 giờ', {
      services: SERVICES,
      preferredTimes: TIMES,
      today: '2026-11-27',
    })
    const r1 = executeFormActions(createDefaultForm(), p1.actions, ctx())
    expect(r1.form.preferredDateFrom).toBe('2026-11-28')
    expect(r1.form.preferredTimeId).toBe('time-morning')

    const pShift = parseUtterance('Lùi lịch lại một ngày', {
      services: SERVICES,
      preferredTimes: TIMES,
      today: '2026-11-27',
    })
    const rShift = executeFormActions(r1.form, pShift.actions, ctx())
    expect(rShift.form.preferredDateFrom).toBe('2026-11-29')
  })

  it('8. extracts multiple fields across 7 sections from a single Vietnamese sentence', () => {
    const sentence =
      'Tôi muốn giám sát tiến độ công trình tại Đại học FPT HCM, quay toàn cảnh tòa nhà, chụp ảnh mái, quay video, bay sáng mai lúc 8 giờ, lấy thông tin liên hệ từ tài khoản.'
    const plan = parseUtterance(sentence, {
      services: SERVICES,
      preferredTimes: TIMES,
      today: '2026-11-27',
    })
    const types = plan.actions.map((a) => a.type)
    expect(types).toContain('select_service')
    expect(types).toContain('set_flight_purpose')
    expect(types).toContain('set_description')
    expect(types).toContain('search_location')
    expect(types).toContain('checklist_set_videos')
    expect(types).toContain('autofill_account_contact')
    expect(types).toContain('set_schedule')
  })

  it('9. distinguishes consultation questions from state-mutating actions and handles "Quay lại chọn dịch vụ"', () => {
    const q = parseUtterance('Quay video có được không?', { services: SERVICES })
    expect(q.actions).toEqual([])

    const backToService = parseUtterance('Quay lại chọn dịch vụ.', {
      services: SERVICES,
      memory: { activeStep: 1, activeSection: 'purpose', currentServiceId: 'svc-build' },
    })
    expect(backToService.actions).toEqual([{ type: 'reopen_selection', target: 'service' }])
  })

  it('10. prevents duplicate submission with submitOnce and supports undo/redo', async () => {
    const submitFn = vi.fn(async () => true)
    const guarded = submitOnce(submitFn)
    const [a, b] = await Promise.all([guarded(), guarded()])
    expect(submitFn).toHaveBeenCalledTimes(1)
    expect(a).toBe(true)
    expect(b).toBe(false)

    const hist = new DraftHistory()
    const f0 = createDefaultForm()
    const f1 = { ...f0, serviceId: 'svc-build' }
    hist.observe(f0)
    hist.record(f0, f1)
    const undone = hist.undo()
    expect(undone.ok && undone.form.serviceId).toBe('')
    const redone = hist.redo()
    expect(redone.ok && redone.form.serviceId).toBe('svc-build')
  })
})

