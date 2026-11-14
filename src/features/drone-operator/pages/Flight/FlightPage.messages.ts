import { defineMessages } from '../../../../shared/i18n'

export const flightPageMessages = defineMessages({
  vi: {
    opening: 'Đang mở buồng lái...',
    backToMissions: 'Về Mission của tôi',
    throughPreflight: 'Đến bước kiểm tra trước bay',
    loadMissionFailed: 'Không tải được mission',
    cockpitOpenFailed: 'Không mở được buồng lái',
    backToMission: 'Quay lại Mission',
    noDroneTitle: 'Mission chưa có thiết bị',
    noDroneMessage:
      'Mission này chưa được gán thiết bị nên chưa thể mở buồng lái. Hãy quay lại danh sách mission hoặc yêu cầu quản lý gán thiết bị trước.',
    rtbFailed: 'Không chuyển được nhiệm vụ sang trạng thái Đang trở về',
    landingConfirmTitle: 'Xác nhận dừng bay',
    landingConfirm:
      'Xác nhận drone chưa cất cánh hoặc đã hạ cánh và dừng động cơ để sang bước kiểm tra thiết bị.',
    landingConfirmSubmit: 'Xác nhận và kiểm tra',
    landingConfirmSaving: 'Đang xác nhận…',
    landingConfirmError: 'Không thể xác nhận hạ cánh. Vui lòng thử lại.',
    emergencyPrompt: 'Lý do kết thúc khẩn cấp',
    emergencyUpdateFailed: 'Không cập nhật được mission',
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
    landingConfirmTitle: 'Confirm flight stopped',
    landingConfirm:
      'Confirm that the drone never took off or has landed and stopped its motors before starting inspection.',
    landingConfirmSubmit: 'Confirm and inspect',
    landingConfirmSaving: 'Confirming…',
    landingConfirmError: 'Could not confirm landing. Please try again.',
    emergencyPrompt: 'Reason for emergency termination',
    emergencyUpdateFailed: 'Could not update the mission',
  },
})
