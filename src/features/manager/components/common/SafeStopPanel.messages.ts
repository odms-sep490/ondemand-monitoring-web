import { defineMessages } from '../../../../shared/i18n'

export const safeStopPanelMessages = defineMessages({
  vi: {
    confirmSent: 'Đã gửi xác nhận an toàn.',
    actionRecorded: 'Thao tác đã được ghi nhận.',
    ariaLabel: (id: string) => `Dừng nhiệm vụ an toàn ${id}`,
    title: 'Dừng nhiệm vụ an toàn',
    loadingStatus: 'Đang tải trạng thái…',
    cannotVerify:
      'Không thể xác minh trạng thái của nhiệm vụ này. Vui lòng làm mới.',
    stopReason: 'Lý do dừng / hủy nhiệm vụ',
    safetyRecord: 'Ghi nhận an toàn',
    waitingAssignee:
      'Đang chờ người được phân công xác nhận an toàn. Bạn chưa thể xác nhận lúc này.',
    requestStop: 'Yêu cầu dừng an toàn',
    confirmGuidance:
      'Chỉ xác nhận sau khi drone đã hạ cánh, dừng động cơ và kết thúc điều khiển.',
    safetyPlaceholder: 'Mô tả tình trạng an toàn đã kiểm tra',
    attestation:
      'Tôi đã kiểm tra: drone đã hạ cánh, dừng động cơ và kết thúc điều khiển.',
    confirmSafe: 'Xác nhận đã an toàn',
    releaseResources: 'Giải phóng tài nguyên',
  },
  en: {
    confirmSent: 'Safety confirmation sent.',
    actionRecorded: 'The action has been recorded.',
    ariaLabel: (id: string) => `Safe mission stop ${id}`,
    title: 'Safe mission stop',
    loadingStatus: 'Loading status…',
    cannotVerify:
      'Unable to verify the status of this Mission. Please refresh.',
    stopReason: 'Reason for stopping / cancelling the Mission',
    safetyRecord: 'Safety record',
    waitingAssignee:
      'Waiting for the assigned person to confirm safety. You cannot confirm at this time.',
    requestStop: 'Request safe stop',
    confirmGuidance:
      'Only confirm after the drone has landed, the motors have stopped and control has ended.',
    safetyPlaceholder: 'Describe the safety status you checked',
    attestation:
      'I have checked: the drone has landed, the motors have stopped and control has ended.',
    confirmSafe: 'Confirm it is safe',
    releaseResources: 'Release resources',
  },
})
