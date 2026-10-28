import { ApiError } from '../../../shared/api/httpClient'

export function planningBlocker(code: string): string {
  const advice: Record<string, string> = {
    ORDER_NOT_APPROVED: 'Order chưa ở trạng thái cho phép chốt kế hoạch.',
    INVOICE_NOT_PAYABLE:
      'Khách hàng cần chấp nhận báo giá trước khi tạo Mission.',
    FINAL_PAYMENT_REQUIRED:
      'Khách hàng cần thanh toán đủ trước khi nhận bản gốc.',
    DELIVERABLE_NOT_RELEASED: 'Bản gốc chưa được bàn giao cho khách hàng.',
    NO_EFFECTIVE_MISSIONS:
      'Thêm ít nhất một Mission vào kế hoạch trước khi chốt.',
    CHECKLIST_ASSIGNMENT_NOT_FINALIZED: 'Phân công checklist chưa được chốt.',
    CHECKLIST_EXECUTION_INTEGRITY_INVALID:
      'Phân công checklist cần được kiểm tra lại trước khi chốt.',
    MULTI_MISSION_LEGACY_ORDER_NOT_MIGRATED:
      'Kế hoạch cũ cần được kiểm tra trước khi tiếp tục.',
    INVALID_REQUEST: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra và thử lại.',
    ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
    UNAUTHORIZED: 'Vui lòng đăng nhập lại để tiếp tục.',
    EXECUTION_PLAN_REVISION_CONFLICT:
      'Kế hoạch đã được thay đổi ở phiên bản khác. Vui lòng tải lại dữ liệu.',
    CHECKLIST_COVERAGE_INCOMPLETE:
      'Còn checklist chưa được phân công. Kiểm tra các yêu cầu trước khi chốt kế hoạch.',
    MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
      'Mission chưa đủ điều kiện hủy. Cần hoàn tất xác nhận an toàn và đóng phiên vận hành trước khi hủy.',
    MISSION_SAFE_STOP_NOT_READY:
      'Mission chưa ở trạng thái an toàn để tiếp tục. Làm mới trạng thái hoặc chờ nhân sự vận hành.',
    MISSION_SAFE_STOP_FAILED:
      'Dừng an toàn chưa hoàn tất. Làm mới trạng thái và liên hệ nhân sự vận hành.',
    MISSION_RESULT_ALREADY_APPROVED:
      'Kết quả đã được duyệt; không thể hủy lịch sử Mission này.',
    RESOURCE_TIME_CONFLICT:
      'Tài nguyên bị trùng lịch. Chọn tài nguyên hoặc thời gian khác và tải lại danh sách khả dụng.',
    RESOURCE_ALREADY_RESERVED:
      'Tài nguyên đã được giữ. Tải lại danh sách khả dụng và chọn tài nguyên khác.',
    SCHEDULE_CONFLICT:
      'Lịch tài nguyên xung đột. Tải lại danh sách khả dụng và chọn lịch khác.',
    EXECUTION_PLAN_NOT_DRAFT:
      'Kế hoạch/Mission đã chốt. Cần điều chỉnh kế hoạch trước khi tiếp tục lập kế hoạch.',
  }
  // The original ApiError and plan.blockers retain codes/IDs for diagnostics.
  // Unknown server text is not copied into the product UI.
  return (
    advice[code.split(':', 1)[0]] ??
    'Chưa thể thực hiện thao tác. Vui lòng tải lại dữ liệu hoặc liên hệ hỗ trợ.'
  )
}

const backendMessageTranslations: Record<string, string> = {
  'A Mission must have at least one checklist item':
    'Mỗi nhiệm vụ (Mission) phải được gán ít nhất một hạng mục checklist.',
  'Scheduled start time and scheduled end time must be specified':
    'Vui lòng chọn thời gian bắt đầu và kết thúc dự kiến.',
  'Scheduled start time must be before scheduled end time':
    'Giờ cất cánh phải trước giờ kết thúc dự kiến.',
  'Scheduled start time and scheduled end time must be on the same day':
    'Giờ cất cánh và giờ kết thúc phải trong cùng một ngày.',
  'An accepted quote and invoice are required before mission creation':
    'Cần có báo giá được khách chấp nhận và hóa đơn hợp lệ trước khi tạo Mission.',
  'The required deposit must be paid before mission planning can begin':
    'Khách hàng cần thanh toán tiền đặt cọc trước khi lập kế hoạch Mission.',
  'Execution plan is not draft':
    'Kế hoạch đã chốt, không thể điều chỉnh hoặc thêm Mission mới.',
  'Order not found':
    'Không tìm thấy thông tin đơn hàng.',
  'Mission not found':
    'Không tìm thấy thông tin nhiệm vụ.',
  'Mission replacement cross order':
    'Không thể thay thế Mission giữa các đơn hàng khác nhau.',
  'Mission result already approved':
    'Kết quả nhiệm vụ đã được duyệt, không thể thay thế.',
  'Original mission is not cancelled':
    'Nhiệm vụ gốc chưa ở trạng thái bị hủy.',
  'Replacement mission already exists':
    'Đã tồn tại nhiệm vụ thay thế cho Mission này.',
  'Upload exceeds the configured size limit':
    'Tệp tải lên vượt quá dung lượng cho phép.',
  'Invalid order checklist snapshot':
    'Dữ liệu checklist của đơn hàng không hợp lệ.',
}

export function translateBackendError(error: unknown): string {
  if (resourceAssignmentConflict(error))
    return planningBlocker('RESOURCE_TIME_CONFLICT')
  if (!(error instanceof ApiError)) {
    if (error instanceof Error) return error.message
    return 'Không thể kết nối. Giữ nguyên dữ liệu và thử lại sau.'
  }

  const raw = error.message?.trim() || ''

  // 1. Time slot pattern
  if (/within customer preferred time slot/i.test(raw)) {
    const slot = raw.replace(/.*within customer preferred time slot:\s*/i, '').trim()
    return `Thời gian bay phải nằm trong khung giờ khách yêu cầu: ${slot}.`
  }

  // 2. Date ranges pattern
  if (/within customer preferred dates/i.test(raw)) {
    if (/from\s+/i.test(raw)) {
      const fromDate = raw
        .replace(/.*from\s+/i, '')
        .trim()
        .replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3/$2/$1')
      return `Ngày bay phải nằm trong khoảng thời gian khách yêu cầu (từ ngày ${fromDate}).`
    }
    if (/to\s+/i.test(raw)) {
      const toDate = raw
        .replace(/.*to\s+/i, '')
        .trim()
        .replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3/$2/$1')
      return `Ngày bay phải nằm trong khoảng thời gian khách yêu cầu (đến ngày ${toDate}).`
    }
    return 'Ngày bay phải nằm trong khoảng thời gian khách yêu cầu.'
  }

  // 3. Preferred window pattern
  if (/within customer preferred window/i.test(raw)) {
    const win = raw.replace(/.*within customer preferred window:\s*/i, '').trim()
    return `Giờ bay phải nằm trong khung giờ khách yêu cầu: ${win}.`
  }

  // 4. Direct or partial match with dictionary
  for (const [en, vi] of Object.entries(backendMessageTranslations)) {
    if (raw.toLowerCase().includes(en.toLowerCase())) {
      return vi
    }
  }

  // 5. Fallback to code if message is empty or generic
  if (error.code) {
    const codeAdvice = planningBlocker(error.code)
    if (
      codeAdvice &&
      codeAdvice !== 'Thông tin chưa hợp lệ. Vui lòng kiểm tra và thử lại.'
    ) {
      return codeAdvice
    }
  }

  return raw || 'Thông tin chưa hợp lệ. Vui lòng kiểm tra và thử lại.'
}

export function finalizeError(error: unknown): string {
  if (error instanceof ApiError) {
    const raw = error.message?.trim()
    const genericMessages = new Set([
      'Invalid request',
      'Yêu cầu không hợp lệ',
      'Every Order checklist item must be assigned to an effective Mission',
      'Execution plan must be DRAFT',
      'Mission status is invalid for this operation',
    ])

    // Finalize validation often returns INVALID_REQUEST with a useful detail
    // (for example, which required staff role or MAIN device is missing).
    // Keep that detail instead of collapsing every failure into one blocker.
    if (raw && raw !== error.code && !genericMessages.has(raw)) return raw
    if (error.code) return planningBlocker(error.code)
    if (raw) return translateBackendError(error)
  }
  return 'Không thể chốt kế hoạch. Vui lòng thử lại.'
}

export function planningError(error: unknown): string {
  return translateBackendError(error)
}

export function resourceAssignmentConflict(error: unknown): boolean {
  return (
    (error instanceof ApiError &&
      [
        'RESOURCE_TIME_CONFLICT',
        'RESOURCE_ALREADY_RESERVED',
        'SCHEDULE_CONFLICT',
      ].includes(error.code ?? '')) ||
    (error instanceof Error &&
      error.message === 'Resource is reserved during the requested interval')
  )
}
