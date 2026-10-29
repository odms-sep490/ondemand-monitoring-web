import { missionStatusTone } from '../../../../shared/lib/statusTone'

// ─── Status maps ────────────────────────────────────────────────────────────

export const STATUS_TONE = {
  ...missionStatusTone,
  UNKNOWN: 'gray',
  PENDING: 'gray',
  ACCEPTED: 'green',
  IN_FLIGHT: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
  FAILED: 'red',
} as const

export const STATUS_LABEL: Record<string, string> = {
  PLANNING: 'Đang lập kế hoạch',
  CREATED: 'Đã tạo nhiệm vụ',
  WAITING_DEPOSIT: 'Chờ xác nhận đặt cọc',
  READY: 'Sẵn sàng phân công',
  RESOURCE_ASSIGNING: 'Đang phân công nguồn lực',
  WAITING_OPERATOR_ACCEPTANCE: 'Chờ người vận hành xác nhận',
  SCHEDULED: 'Đã bắt đầu nhiệm vụ',
  CONNECTED: 'Đã kết nối thiết bị',
  PREFLIGHT_CHECKING: 'Đang kiểm tra trước bay',
  FAILED_PREFLIGHT: 'Kiểm tra trước bay không đạt',
  READY_TO_FLY: 'Sẵn sàng bay',
  IN_PROGRESS: 'Đang thực hiện',
  RETURNING: 'Đang trở về',
  POSTFLIGHT_CHECKING: 'Đang kiểm tra sau bay',
  PENDING_REVIEW: 'Chờ nghiệm thu',
  PENDING_APPROVAL: 'Chờ Manager xử lý',
  CANCELLED: 'Đã hủy',
  UNKNOWN: 'Trạng thái chưa hỗ trợ',
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã nhận',
  IN_FLIGHT: 'Đang bay',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Bị từ chối',
  FAILED: 'Không hoàn thành',
}

export const STATUS_LABEL_EN: Record<string, string> = {
  PLANNING: 'Planning',
  CREATED: 'Mission created',
  WAITING_DEPOSIT: 'Awaiting deposit confirmation',
  READY: 'Ready for assignment',
  RESOURCE_ASSIGNING: 'Assigning resources',
  WAITING_OPERATOR_ACCEPTANCE: 'Awaiting operator confirmation',
  SCHEDULED: 'Mission started',
  CONNECTED: 'Device connected',
  PREFLIGHT_CHECKING: 'Preflight in progress',
  FAILED_PREFLIGHT: 'Preflight failed',
  READY_TO_FLY: 'Ready to fly',
  IN_PROGRESS: 'In progress',
  RETURNING: 'Returning',
  POSTFLIGHT_CHECKING: 'Postflight in progress',
  PENDING_REVIEW: 'Awaiting acceptance',
  PENDING_APPROVAL: 'Awaiting Manager review',
  CANCELLED: 'Cancelled',
  UNKNOWN: 'Unsupported status',
  PENDING: 'Awaiting reply',
  ACCEPTED: 'Accepted',
  IN_FLIGHT: 'In flight',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  FAILED: 'Not completed',
}

export const GCS_CONNECTED_STATUSES = new Set([
  'PENDING_REVIEW',
  'CONNECTED',
  'PREFLIGHT_CHECKING',
  'READY_TO_FLY',
  'IN_FLIGHT',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'COMPLETED',
])

export const INSPECTION_MEDIA_STATUSES = new Set([
  'PENDING_REVIEW',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'COMPLETED',
])

export const PREFLIGHT_NAME_LABELS: Record<string, string> = {
  BACKEND: 'Kết nối hệ thống',
  BATTERY: 'Pin',
  CAMERA: 'Camera dưới',
  GAZEBO: 'Mô phỏng Gazebo',
  LIDAR: 'Cảm biến LiDAR',
  LOCAL_POSITION: 'Vị trí cục bộ',
  MAVSDK: 'Kết nối MAVSDK',
  MAVSDK_HEALTH: 'Sức khỏe MAVSDK',
  MEDIA: 'Tải media',
  MODULES: 'Kiểm tra module',
  PX4: 'Bộ điều khiển bay PX4',
  PX4_CONTROL: 'Điều khiển PX4',
}

export const PREFLIGHT_NAME_FALLBACKS: Record<string, string> = {
  'Backend Connection': 'Kết nối hệ thống',
  Battery: 'Pin',
  'Downward Camera': 'Camera dưới',
  'Gazebo Simulation': 'Mô phỏng Gazebo',
  LiDAR: 'Cảm biến LiDAR',
  'Local Position': 'Vị trí cục bộ',
  'MAVSDK Connection': 'Kết nối MAVSDK',
  'MAVSDK Health': 'Sức khỏe MAVSDK',
  'Media Upload': 'Tải media',
  'Module Check': 'Kiểm tra module',
  'PX4 Control': 'Điều khiển PX4',
  'PX4 Flight Controller': 'Bộ điều khiển bay PX4',
}
