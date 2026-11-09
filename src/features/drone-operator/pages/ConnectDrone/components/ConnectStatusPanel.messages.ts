import { defineMessages } from '../../../../../shared/i18n'

export const connectStatusPanelMessages = defineMessages({
  vi: {
    trackerSteps: [
      'Xác thực operator',
      'Mở liên kết tới GCS',
      'Nhận heartbeat telemetry',
    ],
    noMissionSelected: 'Chưa chọn mission',
    received: 'Đã nhận',
    missionBeingAssigned: 'Mission đang được gán',
    noSchedule: 'Chưa có lịch bay',
    noDroneAssigned: 'Chưa gán thiết bị',
    noAddress: 'Chưa có địa chỉ',
    scheduleLabel: 'Lịch bay',
    deviceFieldLabel: 'Thiết bị',
    locationFieldLabel: 'Địa điểm',
    connectionStatus: 'Trạng thái kết nối',
    disconnectReason: 'Lý do mất kết nối',
    stepState: {
      complete: 'Đã hoàn tất',
      inProgress: 'Đang xử lý',
      failed: 'Thất bại',
      waiting: 'Đang chờ',
    },
    badge: {
      connected: 'Đã kết nối',
      connecting: 'Đang kết nối',
      failed: 'Thất bại',
      default: 'Chưa kết nối',
    },
    heartbeatTelemetry: 'Heartbeat telemetry',
    telemetrySummary: (satellites: number) =>
      `telemetry_active = TRUE · pin thiết bị 100% · ${satellites} vệ tinh`,
    continueToPrecheck: 'Tiếp tục kiểm tra trước bay',
    backToMission: 'Quay lại mission',
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
    scheduleLabel: 'Flight time',
    deviceFieldLabel: 'Device',
    locationFieldLabel: 'Location',
    connectionStatus: 'Connection status',
    disconnectReason: 'Connection failure reason',
    stepState: {
      complete: 'Completed',
      inProgress: 'In progress',
      failed: 'Failed',
      waiting: 'Waiting',
    },
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
