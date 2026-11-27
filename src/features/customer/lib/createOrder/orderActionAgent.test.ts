import { describe, expect, it, vi } from 'vitest'
import { createDefaultForm } from './draftStorage'
import {
  DraftHistory,
  TranscriptGuard,
  agentChangesToActions,
  executeFormActions,
  parseAgentAction,
  parseUtterance,
  replyFromResults,
  submitBlockers,
  submitOnce,
  type AgentAction,
  type ExecutionContext,
} from './orderActionAgent'
import { requestInfoPanelMessages } from '../../pages/CreateOrder/components/RequestInfoPanel.messages'

const services = [
  { id: 'svc-factory', name: 'Kiểm tra nhà xưởng' },
  { id: 'svc-forest', name: 'Giám sát rừng' },
  { id: 'svc-build', name: 'Giám sát công trình' },
]
const ctx = (handlers: ExecutionContext['handlers'] = {}): ExecutionContext => ({
  services,
  purposeLabels: requestInfoPanelMessages.vi.flightPurposes,
  handlers,
})
const parse = (text: string) => parseUtterance(text, { services, today: '2026-11-27' })
const run = (text: string, form = createDefaultForm(), handlers = {}) =>
  executeFormActions(form, parse(text).actions, ctx(handlers))

describe('order action agent', () => {
  it('chọn dịch vụ theo tên', () => {
    const { form, results } = run('Tôi muốn chọn dịch vụ giám sát công trình')
    expect(form.serviceId).toBe('svc-build')
    expect(results[0]).toMatchObject({ ok: true, message: 'Đã chọn dịch vụ Giám sát công trình.' })
  })

  it('sửa lỗi nhận dạng giọng nói và tiếng Việt không dấu', () => {
    expect(run('tôi múa trò dịch vụ giám sát công trình').form.serviceId).toBe('svc-build')
    expect(run('toi mun chon dv giam sat cong trinh').form.serviceId).toBe('svc-build')
  })

  it('đổi dịch vụ và xoá dữ liệu phụ thuộc dịch vụ cũ', () => {
    const start = { ...createDefaultForm(), serviceId: 'svc-factory', deliverableTypeId: 'd1' }
    const { form } = run('đổi sang giám sát rừng', start)
    expect(form.serviceId).toBe('svc-forest')
    expect(form.deliverableTypeId).toBe('')
  })

  it('chọn cái thứ hai theo thứ tự hiển thị', () => {
    expect(run('chọn cái thứ hai').form.serviceId).toBe('svc-forest')
  })

  it('nhiều action trong một câu', () => {
    const { form, results } = run(
      'chọn giám sát công trình, mục đích theo dõi tiến độ thi công, người liên hệ là Nguyễn An, số 0912 345 678',
    )
    expect(form.serviceId).toBe('svc-build')
    expect(form.flightPurpose).toBe('CONSTRUCTION_MONITORING')
    expect(form.siteContactName).toBe('Nguyễn An')
    expect(form.siteContactPhone).toBe('0912345678')
    expect(results.every((r) => r.ok)).toBe(true)
  })

  it('tích hết checklist qua đúng handler của editor', () => {
    const selectAll = vi.fn(() => 4)
    const { results } = run('tích hết các hạng mục checklist', { ...createDefaultForm(), serviceId: 'svc-build' }, { checklistSelectAll: selectAll })
    expect(selectAll).toHaveBeenCalledOnce()
    expect(results[0].ok).toBe(true)
  })

  it('bỏ quay video', () => {
    const setVideos = vi.fn(() => 2)
    run('không cần quay video', { ...createDefaultForm(), serviceId: 'svc-build' }, { checklistSetVideos: setVideos })
    expect(setVideos).toHaveBeenCalledWith(0)
  })

  it('checklist chưa sẵn sàng thì không nói "Đã"', () => {
    const { results } = run('tích hết checklist', { ...createDefaultForm(), serviceId: 'svc-build' }, { checklistSelectAll: () => null })
    expect(results[0].ok).toBe(false)
    expect(replyFromResults(results)).not.toMatch(/^Đã/)
  })

  it('service ID sai bị từ chối', () => {
    const { form, results } = executeFormActions(createDefaultForm(), [{ type: 'select_service', serviceId: 'hack' }], ctx())
    expect(form.serviceId).toBe('')
    expect(results[0].ok).toBe(false)
    expect(replyFromResults(results)).not.toContain('Đã chọn')
  })

  it('schema từ chối action ngoài allowlist', () => {
    expect(parseAgentAction({ type: 'run_sql', sql: 'drop table' })).toBeNull()
    expect(parseAgentAction({ type: 'set_contact', phone: '123' })).toBeNull()
    const { results } = executeFormActions(createDefaultForm(), [{ type: 'fetch_url' } as unknown as AgentAction], ctx())
    expect(results[0].ok).toBe(false)
  })

  it('địa điểm mơ hồ thì hỏi lại đúng một câu, không bịa tọa độ', () => {
    const result = parse('bay ở khu vực gần đây')
    expect(result.actions).toEqual([])
    expect(result.clarification?.match(/\?/g)).toHaveLength(1)
  })

  it('nhiều dịch vụ khớp như nhau thì hỏi lại', () => {
    const result = parseUtterance('chọn dịch vụ giám sát', {
      services: [{ id: 'a', name: 'Giám sát A' }, { id: 'b', name: 'Giám sát B' }],
    })
    expect(result.actions).toEqual([])
    expect(result.clarification).toContain('Giám sát A hay Giám sát B')
  })

  it('nhận lệnh gửi yêu cầu và lệnh reset có xác nhận', () => {
    expect(parse('gửi yêu cầu đi').actions).toContainEqual({ type: 'submit' })
    expect(parse('làm lại từ đầu').actions).toContainEqual({ type: 'reset' })
  })

  it('chuyển đổi đề xuất từ backend sang action hợp lệ và bỏ qua trường sai', () => {
    const actions = agentChangesToActions({
      serviceId: 'svc-build',
      flightPurpose: 'CONSTRUCTION_MONITORING',
      siteContactPhone: '123', // invalid phone rejected by schema
    })
    expect(actions).toEqual([
      { type: 'select_service', serviceId: 'svc-build' },
      { type: 'set_flight_purpose', purpose: 'CONSTRUCTION_MONITORING' },
    ])
  })

  it('lịch bay chỉ đặt từ ngày khách nói rõ', () => {
    expect(parse('bay ngày 5/12 đến 7/12').actions).toContainEqual({ type: 'set_schedule', dateFrom: '2026-12-05', dateTo: '2026-12-07' })
    expect(parse('chọn giám sát rừng').actions.some((a) => a.type === 'set_schedule')).toBe(false)
  })

  it('V2 Case A: "Cho tôi chọn lại dịch vụ" mở lại giao diện chọn dịch vụ mà không xóa giá trị hiện tại', () => {
    const reopenSection = vi.fn()
    const start = { ...createDefaultForm(), serviceId: 'svc-factory', siteContactName: 'Minh', siteContactPhone: '0912345678' }
    const plan = parseUtterance('Cho tôi chọn lại dịch vụ', { services, memory: { activeStep: 5, activeSection: 'schedule' } })
    expect(plan.actions).toEqual([{ type: 'reopen_selection', target: 'service' }])
    const { form, results } = executeFormActions(start, plan.actions, ctx({ reopenSection }))
    expect(reopenSection).toHaveBeenCalledWith('service')
    expect(form.serviceId).toBe('svc-factory')
    expect(form.siteContactName).toBe('Minh')
    expect(results[0].ok).toBe(true)
  })

  it('V2 Case B & phủ định: "Khoan, không phải nhà xưởng, công trình" đổi thẳng sang Giám sát công trình và giữ dữ liệu tương thích', () => {
    const start = {
      ...createDefaultForm(),
      serviceId: 'svc-factory',
      deliverableTypeId: 'del-old',
      siteContactName: 'Linh',
      siteContactPhone: '0987654321',
      preferredDateFrom: '2026-12-10',
      preferredDateTo: '2026-12-12',
    }
    const { form, results } = run('Khoan, không phải nhà xưởng, công trình', start)
    expect(form.serviceId).toBe('svc-build')
    expect(form.deliverableTypeId).toBe('')
    expect(form.siteContactName).toBe('Linh')
    expect(form.siteContactPhone).toBe('0987654321')
    expect(form.preferredDateFrom).toBe('2026-12-10')
    expect(results[0]).toMatchObject({ ok: true, message: 'Đã chọn dịch vụ Giám sát công trình.' })
  })

  it('V2 Case C: "Tôi không muốn chọn dịch vụ này nữa" bỏ chọn dịch vụ và mở lại danh sách dịch vụ', () => {
    const reopenSection = vi.fn()
    const start = { ...createDefaultForm(), serviceId: 'svc-factory', siteContactName: 'An' }
    const plan = parse('Tôi không muốn chọn dịch vụ này nữa')
    expect(plan.actions).toEqual([{ type: 'clear_service' }, { type: 'reopen_selection', target: 'service' }])
    const { form } = executeFormActions(start, plan.actions, ctx({ reopenSection }))
    expect(form.serviceId).toBe('')
    expect(form.siteContactName).toBe('An')
    expect(reopenSection).toHaveBeenCalledWith('service')
  })

  it('V2 Case D: "Chọn lại đi" tự giải theo ngữ cảnh hoặc hỏi 1 câu ngắn khi mơ hồ', () => {
    const fromLocation = parseUtterance('Chọn lại đi', { services, memory: { activeStep: 2, activeSection: 'location' } })
    expect(fromLocation.actions).toEqual([{ type: 'reopen_selection', target: 'location' }])

    const ambiguous = parseUtterance('Chọn lại đi', {
      services,
      memory: { activeStep: 1, activeSection: 'purpose', currentServiceId: 'svc-build', hasFlightPurpose: true },
    })
    expect(ambiguous.actions).toEqual([])
    expect(ambiguous.clarification).toBe('Anh/chị muốn chọn lại dịch vụ hay mục đích bay?')
  })

  it('V2 điều hướng động giữa mọi bước, quay lại, tiếp tục, lấy cái cũ, giữ nguyên, bỏ hết & thêm lại video', () => {
    expect(parse('Quay lại bước đầu').actions).toEqual([{ type: 'reopen_selection', target: 'service' }])
    expect(parse('Quay lại bước trước').actions).toEqual([{ type: 'go_back' }])
    expect(parse('Chuyển sang bước 4').actions).toEqual([{ type: 'navigate_step', step: 4 }])
    expect(parse('Thôi khỏi, tiếp tục đi').actions).toEqual([{ type: 'continue_workflow' }])
    expect(parse('Không, tôi muốn sửa mục đích bay trước').actions).toEqual([{ type: 'reopen_selection', target: 'purpose' }])
    expect(parse('Sửa lại chỗ địa chỉ').actions).toEqual([{ type: 'reopen_selection', target: 'location' }])
    expect(parse('Thôi, giữ nguyên như cũ').actions).toEqual([{ type: 'keep_previous' }])
    expect(parse('Bỏ hết').actions).toEqual([{ type: 'checklist_clear_all' }])
    expect(parse('Thêm lại quay video').actions).toEqual([{ type: 'checklist_set_videos', count: 1 }])
    expect(parse('Tích thêm cái quay phim').actions).toEqual([{ type: 'checklist_set_videos', count: 1 }])

    const restorePrev = parseUtterance('Lấy cái cũ', { services, memory: { previousServiceId: 'svc-factory' } })
    expect(restorePrev.actions).toEqual([{ type: 'select_service', serviceId: 'svc-factory' }])
  })
})

describe('DraftHistory', () => {
  it('hoàn tác thay đổi của AI', () => {
    const history = new DraftHistory()
    const before = createDefaultForm()
    history.observe(before)
    const after = { ...before, serviceId: 'svc-build' }
    history.record(before, after)
    const undone = history.undo()
    expect(undone.ok && undone.form).toBe(before)
  })

  it('AI thấy sửa thủ công và phản hồi cũ không ghi đè', () => {
    const history = new DraftHistory()
    const form = createDefaultForm()
    const expected = history.observe(form)
    history.observe({ ...form, description: 'khách tự sửa' })
    expect(history.canApply(expected)).toBe(false)
  })

  it('không hoàn tác khi khách đã sửa sau thao tác AI', () => {
    const history = new DraftHistory()
    const before = createDefaultForm()
    history.observe(before)
    const after = { ...before, serviceId: 'svc-build' }
    history.record(before, after)
    history.observe({ ...after, description: 'sửa tay' })
    expect(history.undo().ok).toBe(false)
  })
})

describe('TranscriptGuard', () => {
  it('bỏ transcript cuối trùng lặp', () => {
    const guard = new TranscriptGuard()
    expect(guard.accept('chọn giám sát công trình', 1000)).toBe(true)
    expect(guard.accept('Chọn giám sát công trình.', 1500)).toBe(false)
    expect(guard.accept('chọn giám sát công trình', 9000)).toBe(true)
  })

  it('bỏ qua tiếng TTS của chính trợ lý', () => {
    const guard = new TranscriptGuard()
    guard.rememberSpoken('Đã chọn dịch vụ Giám sát công trình.')
    expect(guard.accept('đã chọn dịch vụ giám sát công trình')).toBe(false)
  })
})

describe('submit gate', () => {
  it('gửi khi còn thiếu bị chặn', () => {
    expect(submitBlockers({ 1: true, 2: false, 3: true, 4: true, 5: false, 6: true }, true)).toEqual([2, 5])
    expect(submitBlockers({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }, false)).toEqual([3])
  })

  it('gửi hợp lệ đúng một lần', async () => {
    const backend = vi.fn(async () => true)
    const send = submitOnce(backend)
    await Promise.all([send(), send(), send()])
    await send()
    expect(submitBlockers({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }, true)).toEqual([])
    expect(backend).toHaveBeenCalledOnce()
  })
})
