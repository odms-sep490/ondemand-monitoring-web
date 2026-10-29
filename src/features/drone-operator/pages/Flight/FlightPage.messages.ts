import { defineMessages } from '../../../../shared/i18n'

export const flightPageMessages = defineMessages({
  vi: {
    opening: 'Đang mở buồng lái...',
    backToMissions: 'Về nhiệm vụ của tôi',
    throughPreflight: 'Qua Preflight',
    loadMissionFailed: 'Không tải được nhiệm vụ',
    cockpitOpenFailed: 'Không mở được buồng lái',
    backToMission: 'Quay lại nhiệm vụ',
    noDroneTitle: 'Nhiệm vụ chưa có thiết bị',
    noDroneMessage:
      'Nhiệm vụ này chưa được gán thiết bị nên chưa thể mở buồng lái. Hãy quay lại danh sách nhiệm vụ hoặc yêu cầu quản lý gán thiết bị trước.',
    rtbFailed: 'Không chuyển được nhiệm vụ sang RETURNING',
    emergencyPrompt: 'Lý do kết thúc khẩn cấp',
    emergencyUpdateFailed: 'Không cập nhật được nhiệm vụ',
  },
  en: {
    opening: 'Opening the cockpit...',
    backToMissions: 'Back to my missions',
    throughPreflight: 'Go to preflight',
    loadMissionFailed: 'Could not load the mission',
    cockpitOpenFailed: 'Could not open the cockpit',
    backToMission: 'Back to mission',
    noDroneTitle: 'Mission has no device',
    noDroneMessage:
      'This mission has no device assigned yet, so the cockpit cannot open. Go back to the mission list or ask a manager to assign a device first.',
    rtbFailed: 'Could not move the mission to RETURNING',
    emergencyPrompt: 'Reason for emergency termination',
    emergencyUpdateFailed: 'Could not update the mission',
  },
})
