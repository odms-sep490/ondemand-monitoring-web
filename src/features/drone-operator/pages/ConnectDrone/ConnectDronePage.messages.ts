import { defineMessages } from '../../../../shared/i18n'

export const connectDronePageMessages = defineMessages({
  vi: {
    gcsOptions: ['Flight Controller hiện tại'],
    noMissionAssigned: 'Mission chưa được gán thiết bị',
    connectFailed: 'Không kết nối được Flight Controller',
    stepTitle: 'Kết nối thiết bị',
    noMissionSelected: 'Chưa chọn mission',
    noDroneAssigned: 'Chưa gán thiết bị',
    connectionTitle: 'Kết nối Flight Controller',
    gcsAriaLabel: 'GCS',
    connected: 'Đã kết nối',
    connecting: 'Đang kết nối...',
    retry: 'Thử lại',
    connect: 'Kết nối',
    sessionNote:
      'Phiên điều khiển được xác thực bằng tài khoản operator và thiết bị đã gán cho mission.',
  },
  en: {
    gcsOptions: ['Current Flight Controller'],
    noMissionAssigned: 'Mission has no device assigned',
    connectFailed: 'Could not connect to the Flight Controller',
    stepTitle: 'Connect device',
    noMissionSelected: 'No mission selected',
    noDroneAssigned: 'No device assigned',
    connectionTitle: 'Connect Flight Controller',
    gcsAriaLabel: 'GCS',
    connected: 'Connected',
    connecting: 'Connecting...',
    retry: 'Retry',
    connect: 'Connect',
    sessionNote:
      'The control session is authenticated with the operator account and the device assigned to the mission.',
  },
})
