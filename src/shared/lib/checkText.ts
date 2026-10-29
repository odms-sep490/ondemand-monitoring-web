/** Vietnamese labels for backend-provided check names and messages (fallback: original text). */
const NAMES: Record<string, string> = {
  weather: 'Thời tiết',
  'mavsdk connection': 'Kết nối MAVSDK',
  'mavsdk health': 'Trạng thái MAVSDK',
  'module check': 'Kiểm tra module',
  battery: 'Pin',
  'gazebo simulation': 'Mô phỏng Gazebo',
  lidar: 'LiDAR',
  'downward camera': 'Camera hướng xuống',
  'media storage probe': 'Kiểm tra lưu trữ media',
  'px4 flight controller': 'Bộ điều khiển bay PX4',
  'px4 control': 'Điều khiển PX4',
  'backend connection': 'Kết nối hệ thống',
  'local position': 'Vị trí cục bộ',
  'battery handling safety': 'An toàn xử lý pin',
  'communication logs': 'Nhật ký liên lạc',
  'airframe condition': 'Tình trạng khung máy bay',
  'frame and landing gear': 'Khung và càng hạ cánh',
  motors: 'Động cơ',
  'gps positioning': 'Định vị GPS',
  'camera and payload': 'Camera và tải trọng',
  'landing battery': 'Pin khi hạ cánh',
  propellers: 'Cánh quạt',
}

const MESSAGES: Array<[string, string]> = [
  ['post-flight inspection passed', 'Kiểm tra sau chuyến bay đạt'],
  ['post-flight inspection failed', 'Kiểm tra sau chuyến bay không đạt'],
  ['post-flight inspection warning', 'Kiểm tra sau chuyến bay cần lưu ý'],
  ['required components', 'Đã tải đủ thành phần cần thiết'],
  ['fresh scan received', 'Đã nhận dữ liệu quét mới'],
  ['ready for takeoff', 'Sẵn sàng cất cánh'],
  ['camera frames received', 'Đã nhận khung hình camera'],
  ['px4 health ready', 'Trạng thái PX4 sẵn sàng'],
  ['px4 discovered', 'Đã phát hiện PX4'],
  ['drone model loaded', 'Đã tải mô hình drone'],
  ['flight controller ready', 'Bộ điều khiển bay đã sẵn sàng'],
  ['media capture pipeline ready', 'Luồng ghi media đã sẵn sàng'],
  ['jpeg storage round-trip verified; checksum and cleanup passed', 'Đã xác minh lưu trữ JPEG; checksum và dọn dẹp đạt'],
  ['ready to fly', 'Sẵn sàng bay'],
  ['heartbeat not available', 'Chưa nhận được heartbeat'],
  ['waiting for flight controller api', 'Đang chờ API bộ điều khiển bay'],
]

export function viCheckName(name?: string | null): string {
  if (!name) return ''
  return NAMES[name.trim().toLowerCase()] ?? name
}

export function viCheckMessage(message?: string | null): string {
  if (!message) return ''
  const text = message.trim()
  const lower = text.toLowerCase()
  for (const [key, vi] of MESSAGES) {
    if (lower.includes(key)) return vi
  }
  return text
    .replace(/sufficient for operation/i, 'đủ để vận hành')
    .replace(/too low for safe mission start/i, 'quá thấp để bắt đầu an toàn')
    .replace(/px4 battery telemetry/i, 'telemetry pin PX4')
    .replace(/^landing battery/i, 'Pin hạ cánh')
}
