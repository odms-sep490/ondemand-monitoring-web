import { defineMessages } from '../../../../../shared/i18n'

export const preflightItemMessages = defineMessages({
  vi: {
    groups: {
      device: 'Thiết bị',
      connection: 'Kết nối',
      system: 'Hệ thống',
    },
    items: {
      battery: {
        label: 'Pin máy bay',
        detail: 'Dung lượng, điện áp, nhiệt độ và tình trạng pin',
      },
      motor: {
        label: 'Động cơ',
        detail: 'Tình trạng động cơ và hệ thống truyền động',
      },
      propeller: {
        label: 'Cánh quạt',
        detail: 'Nứt, cong, lỏng hoặc hư hỏng',
      },
      airframe: {
        label: 'Thân máy bay',
        detail: 'Khung, càng đáp và các bộ phận lắp ghép',
      },
      camera: {
        label: 'Camera',
        detail: 'Kết nối, hoạt động và khả năng ghi hình',
      },
      lidar: { label: 'LiDAR', detail: 'cảm biến khoảng cách' },
      obstacleSensor: {
        label: 'Cảm biến tránh vật cản',
        detail: 'Tình trạng cảm biến và khả năng phát hiện vật cản',
      },
      modules: { label: 'Module Check', detail: 'system modules' },
      gazebo: { label: 'Gazebo Simulation', detail: 'simulation world' },
      px4: { label: 'Bộ điều khiển bay PX4', detail: 'bộ điều khiển bay' },
      mavsdk: { label: 'Kết nối MAVSDK', detail: 'cầu nối telemetry' },
      px4Control: { label: 'Điều khiển PX4', detail: 'kênh lệnh' },
      localPosition: { label: 'Local Position', detail: 'PX4 local pose' },
      mavsdkHealth: { label: 'Trạng thái MAVSDK', detail: 'điều kiện arm' },
      backend: { label: 'Kết nối backend', detail: 'backend mission' },
      media: { label: 'Tải media', detail: 'luồng upload' },
    },
    pass: 'Đạt',
    fail: 'Không đạt',
    notePlaceholder: 'Ghi chú lỗi (bắt buộc khi không đạt)',
  },
  en: {
    groups: {
      device: 'Device',
      connection: 'Connection',
      system: 'System',
    },
    items: {
      battery: {
        label: 'Aircraft battery',
        detail: 'Capacity, voltage, temperature, and battery condition',
      },
      motor: {
        label: 'Motors',
        detail: 'Motor and drivetrain condition',
      },
      propeller: {
        label: 'Propellers',
        detail: 'Cracks, bending, looseness, or damage',
      },
      airframe: {
        label: 'Airframe',
        detail: 'Frame, landing gear, and attached components',
      },
      camera: {
        label: 'Camera',
        detail: 'Connection, operation, and recording capability',
      },
      lidar: { label: 'LiDAR', detail: 'range sensor' },
      obstacleSensor: {
        label: 'Obstacle sensors',
        detail: 'Sensor condition and obstacle detection capability',
      },
      modules: { label: 'Module Check', detail: 'system modules' },
      gazebo: { label: 'Gazebo Simulation', detail: 'simulation world' },
      px4: { label: 'PX4 Flight Controller', detail: 'flight controller' },
      mavsdk: { label: 'MAVSDK Connection', detail: 'telemetry bridge' },
      px4Control: { label: 'PX4 Control', detail: 'command channel' },
      localPosition: { label: 'Local Position', detail: 'PX4 local pose' },
      mavsdkHealth: { label: 'MAVSDK Health', detail: 'armable health' },
      backend: { label: 'Backend Connection', detail: 'mission backend' },
      media: { label: 'Media Upload', detail: 'upload pipeline' },
    },
    pass: 'Pass',
    fail: 'Fail',
    notePlaceholder: 'Failure note (required when not passed)',
  },
})
