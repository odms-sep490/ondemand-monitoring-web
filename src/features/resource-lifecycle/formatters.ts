export function formatHoursOrUnknown(
  seconds: number | null | undefined,
  unknownLabel = 'Chưa xác định',
): string {
  if (seconds == null || !Number.isFinite(seconds)) {
    return unknownLabel
  }
  const hours = seconds / 3600
  return `${hours.toFixed(1)} giờ`
}

export function formatPercentOrUnknown(
  percent: number | null | undefined,
  unknownLabel = 'Chưa xác định',
): string {
  if (percent == null || !Number.isFinite(percent)) {
    return unknownLabel
  }
  return `${percent.toFixed(1)}%`
}

export function formatDateTimeOrUnknown(
  iso: string | null | undefined,
  unknownLabel = 'Chưa xác định',
): string {
  if (!iso) return unknownLabel
  const parsed = Date.parse(iso)
  if (!Number.isFinite(parsed)) return unknownLabel
  return new Date(parsed).toLocaleString('vi-VN')
}

export function statusTagColor(status: string): string {
  switch (status) {
    case 'HEALTHY':
    case 'ELIGIBLE':
    case 'VERIFIED':
    case 'RESOLVED':
      return 'green'
    case 'MONITOR':
    case 'MAINTENANCE_DUE_SOON':
    case 'WARNING':
    case 'PENDING':
    case 'ACKNOWLEDGED':
      return 'orange'
    case 'MAINTENANCE_REQUIRED':
    case 'BLOCKED':
    case 'OPEN':
      return 'red'
    default:
      return 'default'
  }
}

const OPERATIONAL_STATUS_VI: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  RESERVED: 'Đã giữ chỗ',
  PREFLIGHT: 'Kiểm tra trước bay',
  IN_MISSION: 'Đang làm nhiệm vụ',
  ACTIVE_MISSION: 'Đang bay',
  RETURNING: 'Đang quay về',
  CHARGING: 'Đang sạc',
  IDLE_CHARGING: 'Chờ sạc',
  MAINTENANCE: 'Đang bảo trì',
  OUT_OF_SERVICE: 'Ngừng hoạt động',
  OFFLINE: 'Ngoại tuyến',
  UNKNOWN: 'Chưa xác định',
}

export function operationalStatusVi(status: string | null | undefined): string {
  if (!status) return 'Chưa xác định'
  return OPERATIONAL_STATUS_VI[status] ?? status
}

const ALERT_SEVERITY_VI: Record<string, string> = {
  CRITICAL: 'Nghiêm trọng',
  HIGH: 'Cao',
  WARNING: 'Cảnh báo',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
}

export function alertSeverityVi(severity: string | null | undefined): string {
  if (!severity) return 'Chưa xác định'
  return ALERT_SEVERITY_VI[severity] ?? severity
}

const ALERT_STATUS_VI: Record<string, string> = {
  OPEN: 'Đang mở',
  ACKNOWLEDGED: 'Đã tiếp nhận',
  RESOLVED: 'Đã xử lý',
}

export function alertStatusVi(status: string | null | undefined): string {
  if (!status) return 'Chưa xác định'
  return ALERT_STATUS_VI[status] ?? status
}

const ALERT_TYPE_VI: Record<string, string> = {
  MAINTENANCE_REQUIRED: 'Cần bảo trì',
  MAINTENANCE_DUE_SOON: 'Sắp đến hạn bảo trì',
  WORKFORCE_OVERLOAD: 'Quá tải nhân sự',
  INSUFFICIENT_REST: 'Chưa đủ thời gian nghỉ',
}

export function alertTypeVi(type: string | null | undefined): string {
  if (!type) return 'Khác'
  return ALERT_TYPE_VI[type] ?? type
}

const AUDIT_ACTION_VI: Record<string, string> = {
  MAINTENANCE_CYCLE_TRIGGERED: 'Kích hoạt chu kỳ bảo trì',
  MAINTENANCE_WORK_SUBMITTED: 'Nộp công việc bảo trì',
  MAINTENANCE_INSPECTION_PASSED: 'Nghiệm thu bảo trì đạt',
  MAINTENANCE_INSPECTION_FAILED: 'Nghiệm thu bảo trì chưa đạt',
  POLICY_CREATED: 'Tạo chính sách',
  POLICY_UPDATED: 'Cập nhật chính sách',
  POLICY_ACTIVATED: 'Kích hoạt chính sách',
  POLICY_DEACTIVATED: 'Tắt chính sách',
  USAGE_RECORDED: 'Ghi nhận sử dụng',
  USAGE_RECORD_CREATED: 'Ghi nhận sử dụng thủ công',
  USAGE_RECORD_AUTO_CREATED: 'Tự động ghi nhận sử dụng',
  USAGE_RECORD_VERIFIED: 'Xác nhận bản ghi sử dụng',
  USAGE_RECORD_REJECTED: 'Từ chối bản ghi sử dụng',
  USAGE_VERIFIED: 'Xác nhận bản ghi sử dụng',
  USAGE_REJECTED: 'Từ chối bản ghi sử dụng',
  DEVICE_SPEC_VERIFIED: 'Xác thực thông số thiết bị',
  DEVICE_SPEC_UPDATED: 'Cập nhật thông số thiết bị',
  ALERT_OPEN: 'Phát sinh cảnh báo',
  ALERT_ACKNOWLEDGED: 'Tiếp nhận cảnh báo',
  ALERT_RESOLVED: 'Đóng cảnh báo',
}

export function auditActionVi(action: string | null | undefined): string {
  if (!action) return 'Khác'
  return AUDIT_ACTION_VI[action] ?? action
}

const AUDIT_ACTOR_VI: Record<string, string> = {
  SYSTEM_MISSION_COMPLETION: 'Hệ thống (Hoàn thành nhiệm vụ)',
  SYSTEM: 'Hệ thống',
  SYSTEM_SCHEDULER: 'Hệ thống (Tự động)',
  SYSTEM_SEED: 'Dữ liệu khởi tạo',
  SEED: 'Dữ liệu khởi tạo',
}

export function auditActorVi(actorId: string | null | undefined): string {
  if (!actorId) return 'Hệ thống'
  return AUDIT_ACTOR_VI[actorId] ?? actorId
}

const AUDIT_REASON_VI: Record<string, string> = {
  'Recorded automatically when the mission finished':
    'Tự động ghi nhận khi nhiệm vụ hoàn thành',
}

export function auditReasonVi(reason: string | null | undefined): string {
  if (!reason) return '—'
  if (AUDIT_REASON_VI[reason]) return AUDIT_REASON_VI[reason]
  return reasonVi(reason)
}

const REASON_VI: Record<string, string> = {
  MAINTENANCE_REQUIRED: 'Cần bảo trì định kỳ',
  MAINTENANCE_DUE_SOON: 'Sắp đến ngưỡng bảo trì',
  OPEN_MAINTENANCE_WORKFLOW: 'Đang trong quy trình bảo trì',
  DAILY_LIMIT_EXCEEDED: 'Vượt giới hạn giờ trong ngày',
  WEEKLY_LIMIT_EXCEEDED: 'Vượt giới hạn giờ trong tuần',
  MONTHLY_LIMIT_EXCEEDED: 'Vượt giới hạn giờ trong tháng',
  DAILY_WORKLOAD_LIMIT_EXCEEDED: 'Vượt giới hạn giờ làm trong ngày',
  DAILY_WORKLOAD_NEAR_LIMIT: 'Gần chạm ngưỡng giờ làm trong ngày',
  WEEKLY_WORKLOAD_LIMIT_EXCEEDED: 'Vượt giới hạn giờ làm trong tuần',
  WEEKLY_WORKLOAD_NEAR_LIMIT: 'Gần chạm ngưỡng giờ làm trong tuần',
  MONTHLY_WORKLOAD_LIMIT_EXCEEDED: 'Vượt giới hạn giờ làm trong tháng',
  MONTHLY_WORKLOAD_NEAR_LIMIT: 'Gần chạm ngưỡng giờ làm trong tháng',
  INSUFFICIENT_REST: 'Chưa đủ thời gian nghỉ tối thiểu',
  INSUFFICIENT_REST_TIME: 'Chưa đủ thời gian nghỉ tối thiểu',
  DEVICE_IN_MAINTENANCE: 'Thiết bị đang bảo trì',
  DEVICE_NOT_FOUND: 'Không tìm thấy thiết bị',
  STAFF_NOT_FOUND: 'Không tìm thấy nhân sự',
  PROJECTED_MISSION_EXCEEDS_REMAINING_MAINTENANCE_BUDGET:
    'Thời lượng nhiệm vụ vượt quỹ giờ bảo trì còn lại',
  TELEMETRY_GAP: 'Thiếu dữ liệu telemetry giữa chuyến bay',
  INCONSISTENT_FLIGHT_STATE: 'Trạng thái bay không nhất quán',
  GPS_JUMP: 'Tín hiệu GPS nhảy bất thường',
  AIRBORNE_DURATION_UNVERIFIED: 'Thời lượng bay chưa được xác thực',
  CONFLICTING_TELEMETRY: 'Dữ liệu telemetry xung đột',
}

export function reasonVi(reason: string): string {
  if (reason.startsWith('MISSING_CERTIFICATE:')) {
    const cert = reason.slice('MISSING_CERTIFICATE:'.length)
    return `Thiếu chứng chỉ: ${cert}`
  }
  return REASON_VI[reason] ?? reason
}
