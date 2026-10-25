import { defineMessages } from '../../../../shared/i18n'

export const dronesPageMessages = defineMessages({
  vi: {
    filters: {
      ALL: 'Tất cả',
      AVAILABLE: 'Sẵn sàng',
      FLYING: 'Đang bay',
      MAINTENANCE: 'Bảo trì',
      OUT_OF_SERVICE: 'Ngừng dùng',
    },
    title: 'Đội drone',
    summary: (
      available: number,
      flying: number,
      maintenance: number,
      outOfService: number,
    ) =>
      `${available} sẵn sàng · ${flying} đang bay · ${maintenance} bảo trì · ${outOfService} ngừng dùng`,
    loadError: 'Không tải được đội drone',
    unknownError: 'Lỗi không xác định',
    emptyTitle: 'Không có drone nào',
    emptyDescription: 'Không có drone nào trong bộ lọc này.',
    columns: {
      drone: 'Drone',
      model: 'Model',
      status: 'Trạng thái',
      battery: 'Pin',
      station: 'Trạm',
      payload: 'Payload',
      flightHours: 'Giờ bay',
      lastActivity: 'Hoạt động cuối',
    },
    changeStatus: 'Đổi trạng thái',
    modal: {
      title: (serial: string, model: string) =>
        `Đổi trạng thái — ${serial} ${model}`,
      cannotChange: (status: string) =>
        `Không thể thay đổi trạng thái thủ công từ ${status}.`,
      newStatus: 'Trạng thái mới',
      reason: 'Lý do *',
      reasonPlaceholder: 'Nhập lý do thay đổi trạng thái...',
      reasonRequired: 'Vui lòng nhập lý do',
      cancel: 'Huỷ',
      saving: 'Đang lưu...',
      confirm: 'Xác nhận',
    },
  },
  en: {
    filters: {
      ALL: 'All',
      AVAILABLE: 'Available',
      FLYING: 'Flying',
      MAINTENANCE: 'Maintenance',
      OUT_OF_SERVICE: 'Out of service',
    },
    title: 'Drone fleet',
    summary: (
      available: number,
      flying: number,
      maintenance: number,
      outOfService: number,
    ) =>
      `${available} available · ${flying} flying · ${maintenance} maintenance · ${outOfService} out of service`,
    loadError: 'Could not load the drone fleet',
    unknownError: 'Unknown error',
    emptyTitle: 'No drones found',
    emptyDescription: 'No drones match this filter.',
    columns: {
      drone: 'Drone',
      model: 'Model',
      status: 'Status',
      battery: 'Battery',
      station: 'Station',
      payload: 'Payload',
      flightHours: 'Flight hours',
      lastActivity: 'Last activity',
    },
    changeStatus: 'Change status',
    modal: {
      title: (serial: string, model: string) =>
        `Change status — ${serial} ${model}`,
      cannotChange: (status: string) =>
        `Manual status change is not allowed from ${status}.`,
      newStatus: 'New status',
      reason: 'Reason *',
      reasonPlaceholder: 'Enter the reason for the status change...',
      reasonRequired: 'Please enter a reason',
      cancel: 'Cancel',
      saving: 'Saving...',
      confirm: 'Confirm',
    },
  },
})
