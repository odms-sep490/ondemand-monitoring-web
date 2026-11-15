import { defineMessages } from '../../../../shared/i18n'

export const connectDronePageMessages = defineMessages({
  vi: {
    gcsOptions: ['Bộ điều khiển bay hiện tại'],
    noMissionAssigned: 'Nhiệm vụ chưa được gán thiết bị',
    connectFailed: 'Không kết nối được Bộ điều khiển bay',
    stepTitle: 'Kết nối thiết bị',
    noMissionSelected: 'Chưa chọn nhiệm vụ',
    noDroneAssigned: 'Chưa gán thiết bị',
    connectionTitle: 'Kết nối Bộ điều khiển bay',
    gcsAriaLabel: 'GCS',
    connected: 'Đã kết nối',
    connecting: 'Đang kết nối...',
    retry: 'Thử lại',
    connect: 'Kết nối',
    sessionNote:
      'Phiên điều khiển được xác thực bằng tài khoản người vận hành và thiết bị đã gán cho nhiệm vụ.',
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
