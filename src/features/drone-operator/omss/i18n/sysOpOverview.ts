import { defineMessages } from '../../../../shared/i18n'

export const sysOpOverviewMessages = defineMessages({
  vi: {
    title: 'Tổng quan hệ thống',
    headerLine: 'Người vận hành hệ thống · Vừa làm mới',
    stats: {
      fleetSize: 'Quy mô đội bay',
      active: (count: number) => `${count} đang hoạt động`,
      gcsStations: 'Trạm GCS',
      operational: (count: number) => `${count} đang hoạt động`,
      criticalAlerts: 'Cảnh báo nghiêm trọng',
      maintenanceQueue: 'Hàng chờ bảo trì',
    },
    criticalRequireAttention: (count: number) =>
      `${count} cảnh báo nghiêm trọng cần xử lý ngay`,
    fleetStatus: 'Trạng thái đội bay',
    tableHeaders: {
      droneId: 'Mã drone',
      model: 'Model',
      battery: 'Pin',
      gcs: 'GCS',
      state: 'Trạng thái',
      lastTelemetry: 'Telemetry gần nhất',
    },
    connected: 'Đã kết nối',
    gcsStationsTitle: 'Trạm GCS',
    dronesConnected: (count: number) => `${count} drone đã kết nối`,
    uptime: 'Thời gian hoạt động',
    gcsStatus: {
      operational: 'Đang hoạt động',
      degraded: 'Suy giảm',
      offline: 'Ngoại tuyến',
    },
    systemAlerts: 'Cảnh báo hệ thống',
    openCount: (count: number) => `${count} đang mở`,
  },
  en: {
    title: 'System overview',
    headerLine: 'System Operator · Last refreshed just now',
    stats: {
      fleetSize: 'Fleet size',
      active: (count: number) => `${count} active`,
      gcsStations: 'GCS stations',
      operational: (count: number) => `${count} operational`,
      criticalAlerts: 'Critical alerts',
      maintenanceQueue: 'Maintenance queue',
    },
    criticalRequireAttention: (count: number) =>
      `${count} critical alert${count > 1 ? 's' : ''} require immediate attention`,
    fleetStatus: 'Fleet status',
    tableHeaders: {
      droneId: 'Drone ID',
      model: 'Model',
      battery: 'Battery',
      gcs: 'GCS',
      state: 'State',
      lastTelemetry: 'Last telemetry',
    },
    connected: 'Connected',
    gcsStationsTitle: 'GCS stations',
    dronesConnected: (count: number) => `${count} drones connected`,
    uptime: 'Uptime',
    gcsStatus: {
      operational: 'Operational',
      degraded: 'Degraded',
      offline: 'Offline',
    },
    systemAlerts: 'System alerts',
    openCount: (count: number) => `${count} open`,
  },
})
