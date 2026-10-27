import { defineMessages } from '../../../../../shared/i18n'

export const stopFlowPanelMessages = defineMessages({
  vi: {
    stopMission: (code: string) => `Dừng nhiệm vụ ${code}`,
    confirmCancel: 'Xác nhận hủy nhiệm vụ',
    safeStop: 'Dừng nhiệm vụ an toàn',
    closePanel: 'Đóng bảng thao tác',
    checkingStatus: 'Đang kiểm tra trạng thái…',
    canCancel: 'Nhiệm vụ có thể được hủy. Lịch sử đã ghi nhận sẽ được giữ lại.',
    crewResponsible:
      'Đội bay chịu trách nhiệm đưa nhiệm vụ về trạng thái an toàn trước khi tiếp tục hủy.',
    afterCancel: 'Sau khi hủy, bạn có thể tạo nhiệm vụ thay thế.',
    stopReason: 'Lý do dừng / hủy nhiệm vụ',
    noReason: 'Chưa có thông tin lý do.',
    reasonNotLoaded:
      'Chưa tải được lý do dừng. Làm mới trạng thái trước khi hủy nhiệm vụ.',
    cannotCancelNow:
      'Chưa thể hủy nhiệm vụ lúc này. Làm mới trạng thái để kiểm tra lại.',
    openAdjustPlan: 'Mở điều chỉnh kế hoạch trước khi tiếp tục hủy nhiệm vụ.',
    notReadyToRelease:
      'Chưa đủ điều kiện giải phóng tài nguyên. Kiểm tra với đội bay và làm mới trạng thái.',
    processing: 'Đang xử lý…',
    requestStop: 'Yêu cầu dừng an toàn',
    releaseResources: 'Giải phóng tài nguyên',
    cancelMission: 'Hủy nhiệm vụ',
  },
  en: {
    stopMission: (code: string) => `Stop Mission ${code}`,
    confirmCancel: 'Confirm Mission cancellation',
    safeStop: 'Safely stop Mission',
    closePanel: 'Close action panel',
    checkingStatus: 'Checking status…',
    canCancel: 'The Mission can be cancelled. Recorded history will be kept.',
    crewResponsible:
      'The flight crew is responsible for bringing the Mission to a safe state before the cancellation continues.',
    afterCancel: 'After cancelling, you can create a replacement Mission.',
    stopReason: 'Reason for stopping / cancelling the Mission',
    noReason: 'No reason provided.',
    reasonNotLoaded:
      'The stop reason could not be loaded. Refresh the status before cancelling the Mission.',
    cannotCancelNow:
      'The Mission cannot be cancelled right now. Refresh the status to check again.',
    openAdjustPlan:
      'Open plan adjustment before continuing to cancel the Mission.',
    notReadyToRelease:
      'Not ready to release resources. Check with the flight crew and refresh the status.',
    processing: 'Processing…',
    requestStop: 'Request safe stop',
    releaseResources: 'Release resources',
    cancelMission: 'Cancel Mission',
  },
})
