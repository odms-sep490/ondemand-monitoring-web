import { defineMessages } from '../../../../../shared/i18n'

export const connectStatusPanelMessages = defineMessages({
  vi: {
    trackerSteps: [
      'Xác thực người vận hành',
      'Mở liên kết tới GCS',
      'Nhận heartbeat telemetry',
    ],
    noMissionSelected: 'Chưa chọn nhiệm vụ',
    received: 'Đã nhận',
    missionBeingAssigned: 'Nhiệm vụ đang được gán',
    noSchedule: 'Chưa có lịch bay',
    noDroneAssigned: 'Chưa gán thiết bị',
    noAddress: 'Chưa có địa chỉ',
    codeExpiredTitle: 'Mã kết nối đã hết hạn',
    codeExpiredBody:
      'Mã flight_token chỉ có hiệu lực 10 phút. Yêu cầu quản lý cấp mã mới rồi nhập lại.',
    connectionStatus: 'Trạng thái kết nối',
    badge: {
      connected: 'Đã kết nối',
      connecting: 'Đang kết nối',
      failed: 'Thất bại',
      default: 'Chưa kết nối',
    },
    heartbeatTelemetry: 'Heartbeat telemetry',
    telemetrySummary: (satellites: number) =>
      `telemetry_active = TRUE · pin thiết bị 100% · ${satellites} vệ tinh`,
    continueToPrecheck: 'Tiếp tục: precheck',
    backToMission: 'Quay lại nhiệm vụ',
  },
  en: {
    trackerSteps: [
      'Authenticate operator',
      'Open link to GCS',
      'Receive telemetry heartbeat',
    ],
    noMissionSelected: 'No mission selected',
    received: 'Received',
    missionBeingAssigned: 'Mission is being assigned',
    noSchedule: 'No flight schedule yet',
    noDroneAssigned: 'No device assigned',
    noAddress: 'No address yet',
    codeExpiredTitle: 'Connection code expired',
    codeExpiredBody:
      'The flight_token code is valid for 10 minutes only. Ask a manager to issue a new one and enter it again.',
    connectionStatus: 'Connection status',
    badge: {
      connected: 'Connected',
      connecting: 'Connecting',
      failed: 'Failed',
      default: 'Not connected',
    },
    heartbeatTelemetry: 'Heartbeat telemetry',
    telemetrySummary: (satellites: number) =>
      `telemetry_active = TRUE · device battery 100% · ${satellites} satellites`,
    continueToPrecheck: 'Continue: precheck',
    backToMission: 'Back to mission',
  },
})
