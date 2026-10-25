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
  WAITING_CREW_CONFIRMATION: 'Chờ các thành viên xác nhận',
  WAITING_OPERATOR_ACCEPTANCE: 'Chờ người vận hành xác nhận',
  SCHEDULED: 'Đã bắt đầu Mission',
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
  BACKEND: 'Kết nối backend',
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
  'Backend Connection': 'Kết nối backend',
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
