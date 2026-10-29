import { defineMessages } from '../../../shared/i18n'

export const systemOperatorDevicesScreenMessages = defineMessages({
  vi: {
    bannerTitle: 'Trạng thái đội bay và thiết bị drone',
    bannerSubtitle:
      'Theo dõi dung lượng pin, chất lượng tín hiệu kết nối và lịch sử kiểm tra kỹ thuật.',
    filterAria: 'Lọc theo trạng thái thiết bị',
    filterAll: (count: number) => `Tất cả (${count})`,
    filterLabels: {
      AVAILABLE: 'Sẵn sàng',
      IDLE_CHARGING: 'Đang sạc',
      MAINTENANCE: 'Bảo trì',
    },
    statusLabels: {
      AVAILABLE: 'Sẵn sàng bay',
      IDLE_CHARGING: 'Đang sạc pin',
      MAINTENANCE: 'Đang bảo trì',
      IN_FLIGHT: 'Đang thực hiện nhiệm vụ',
    },
    model: 'Mẫu máy',
    batteryLevel: 'Dung lượng pin',
    telemetrySignal: 'Tín hiệu telemetry',
    updated: 'Cập nhật',
    viewMaintenanceTicket: 'Xem yêu cầu bảo trì',
    justNow: 'Vừa xong',
    minutesAgo: (n: number) => `${n} phút trước`,
    empty: 'Không có thiết bị nào ở trạng thái này',
  },
  en: {
    bannerTitle: 'Fleet and drone device status',
    bannerSubtitle:
      'Track battery level, connection signal quality and technical check history.',
    filterAria: 'Filter by device status',
    filterAll: (count: number) => `All (${count})`,
    filterLabels: {
      AVAILABLE: 'Available',
      IDLE_CHARGING: 'Charging',
      MAINTENANCE: 'Maintenance',
    },
    statusLabels: {
      AVAILABLE: 'Ready to fly',
      IDLE_CHARGING: 'Charging',
      MAINTENANCE: 'Under maintenance',
      IN_FLIGHT: 'On a mission',
    },
    model: 'Model',
    batteryLevel: 'Battery level',
    telemetrySignal: 'Telemetry signal',
    updated: 'Updated',
    viewMaintenanceTicket: 'View maintenance ticket',
    justNow: 'Just now',
    minutesAgo: (n: number) => `${n} min ago`,
    empty: 'No devices with this status',
  },
})
