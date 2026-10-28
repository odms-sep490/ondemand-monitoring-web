import { defineMessages } from '../../../shared/i18n'

const phaseCopy = (label: string, description: string) => [label, description] as const

export const safeStopPresentationMessages = defineMessages({
  vi: {
    errors: {
      ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
      UNAUTHORIZED: 'Vui lòng đăng nhập lại để tiếp tục.',
      INVALID_REQUEST: 'Kiểm tra thông tin xác nhận và thử lại.',
      EXECUTION_PLAN_REVISION_CONFLICT:
        'Kế hoạch đã thay đổi. Làm mới trạng thái trước khi tiếp tục.',
      EXECUTION_PLAN_NOT_DRAFT:
        'Cần mở điều chỉnh kế hoạch trước khi tiếp tục hủy nhiệm vụ.',
      EXECUTION_PLAN_NOT_FINALIZED:
        'Chỉ có thể hủy nhiệm vụ khi kế hoạch thực hiện đã được chốt.',
      MISSION_SAFE_STOP_NOT_READY:
        'Nhiệm vụ chưa ở trạng thái an toàn để tiếp tục. Làm mới trạng thái hoặc liên hệ đội bay.',
      MISSION_SAFE_STOP_FAILED:
        'Chưa hoàn tất dừng an toàn. Liên hệ đội bay và làm mới trạng thái để tiếp tục.',
      MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
        'Cần hoàn tất dừng an toàn trước khi hủy nhiệm vụ.',
      MISSION_CANCELLATION_NOT_ALLOWED:
        'Nhiệm vụ chưa đủ điều kiện hủy. Làm mới trạng thái để kiểm tra lại.',
      MISSION_RESULT_ALREADY_APPROVED:
        'Kết quả đã được duyệt; không thể hủy nhiệm vụ này.',
    } as Record<string, string>,
    failureFallback:
      'Chưa hoàn tất dừng an toàn. Liên hệ đội bay và làm mới trạng thái để kiểm tra lại.',
    actionFallback:
      'Chưa thể thực hiện thao tác. Làm mới trạng thái hoặc liên hệ hỗ trợ.',
    loadFallback: 'Không thể tải trạng thái lúc này. Vui lòng thử lại.',
    refresh: 'Làm mới trạng thái',
    cleanupHint:
      'Có thể giải phóng tài nguyên trước khi tiếp tục hủy nhiệm vụ.',
    progressAria: 'Tiến độ dừng an toàn',
    stepRequested: 'Đã gửi yêu cầu',
    stepConfirmed: 'Xác nhận an toàn',
    stepCleaned: 'Giải phóng tài nguyên',
    stepCancel: 'Hủy nhiệm vụ',
    recorded: 'Đã ghi nhận',
    notRecorded: 'Chưa ghi nhận',
    confirmedAt: (time: string) => `Xác nhận lúc ${time}`,
    staff: {
      notRequested: phaseCopy('Chưa có yêu cầu', 'Quản lý chưa yêu cầu dừng nhiệm vụ.'),
      requested: phaseCopy(
        'Đã yêu cầu dừng',
        'Đưa nhiệm vụ về trạng thái an toàn, sau đó xác nhận khi đã hoàn tất.',
      ),
      inProgress: phaseCopy('Đang xử lý', 'Hoàn tất các thao tác an toàn trước khi xác nhận.'),
      confirmed: phaseCopy('Đã xác nhận an toàn', 'Đang chờ quản lý giải phóng tài nguyên.'),
      cleaned: phaseCopy(
        'Đã hoàn tất dừng an toàn',
        'Tài nguyên đã được giải phóng. Không cần xác nhận thêm.',
      ),
      failed: phaseCopy(
        'Cần xử lý lại',
        'Kiểm tra lại tình trạng an toàn của nhiệm vụ và liên hệ quản lý.',
      ),
      unknown: phaseCopy('Cần kiểm tra trạng thái', 'Làm mới trạng thái trước khi tiếp tục.'),
    },
    manager: {
      notRequested: phaseCopy(
        'Chưa yêu cầu dừng',
        'Nhiệm vụ cần được đưa về trạng thái an toàn trước khi có thể hủy.',
      ),
      requested: phaseCopy(
        'Đã yêu cầu dừng',
        'Đang chờ đội bay đưa nhiệm vụ về trạng thái an toàn và xác nhận.',
      ),
      inProgress: phaseCopy('Đang xử lý', 'Đội bay đang đưa nhiệm vụ về trạng thái an toàn.'),
      confirmed: phaseCopy(
        'Đã xác nhận an toàn',
        'Đội bay đã xác nhận nhiệm vụ ở trạng thái an toàn.',
      ),
      cleaned: phaseCopy(
        'Sẵn sàng hủy',
        'Tài nguyên vận hành đã được giải phóng. Nhiệm vụ hiện có thể được hủy an toàn.',
      ),
      failed: phaseCopy(
        'Cần xử lý lại',
        'Kiểm tra tình trạng nhiệm vụ với đội bay trước khi tiếp tục.',
      ),
      unknown: phaseCopy('Cần kiểm tra trạng thái', 'Làm mới trạng thái trước khi tiếp tục.'),
    },
  },
  en: {
    errors: {
      ACCESS_DENIED: 'You do not have permission to do this.',
      UNAUTHORIZED: 'Please sign in again to continue.',
      INVALID_REQUEST: 'Check the confirmation details and try again.',
      EXECUTION_PLAN_REVISION_CONFLICT:
        'The plan has changed. Refresh the status before continuing.',
      EXECUTION_PLAN_NOT_DRAFT:
        'Reopen plan adjustment before continuing to cancel the mission.',
      EXECUTION_PLAN_NOT_FINALIZED:
        'A mission can only be cancelled once the execution plan is finalized.',
      MISSION_SAFE_STOP_NOT_READY:
        'The mission is not yet in a safe state to continue. Refresh the status or contact the crew.',
      MISSION_SAFE_STOP_FAILED:
        'The safe stop is not complete. Contact the crew and refresh the status to continue.',
      MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
        'Complete the safe stop before cancelling the mission.',
      MISSION_CANCELLATION_NOT_ALLOWED:
        'The mission cannot be cancelled yet. Refresh the status to check again.',
      MISSION_RESULT_ALREADY_APPROVED:
        'The result has been approved; this mission can no longer be cancelled.',
    },
    failureFallback:
      'The safe stop is not complete. Contact the crew and refresh the status to check again.',
    actionFallback:
      'Cannot perform this action. Refresh the status or contact support.',
    loadFallback: 'Cannot load the status right now. Please try again.',
    refresh: 'Refresh status',
    cleanupHint: 'You can release resources before continuing to cancel the mission.',
    progressAria: 'Safe stop progress',
    stepRequested: 'Request sent',
    stepConfirmed: 'Safety confirmed',
    stepCleaned: 'Resources released',
    stepCancel: 'Cancel mission',
    recorded: 'Recorded',
    notRecorded: 'Not recorded',
    confirmedAt: (time: string) => `Confirmed at ${time}`,
    staff: {
      notRequested: phaseCopy('No request yet', 'The manager has not requested a stop.'),
      requested: phaseCopy(
        'Stop requested',
        'Bring the mission to a safe state, then confirm when done.',
      ),
      inProgress: phaseCopy('In progress', 'Finish the safety actions before confirming.'),
      confirmed: phaseCopy('Safety confirmed', 'Waiting for the manager to release resources.'),
      cleaned: phaseCopy(
        'Safe stop complete',
        'Resources have been released. No further confirmation needed.',
      ),
      failed: phaseCopy(
        'Needs another attempt',
        'Re-check the mission safety state and contact the manager.',
      ),
      unknown: phaseCopy('Status needs checking', 'Refresh the status before continuing.'),
    },
    manager: {
      notRequested: phaseCopy(
        'No stop requested',
        'The mission must be brought to a safe state before it can be cancelled.',
      ),
      requested: phaseCopy(
        'Stop requested',
        'Waiting for the crew to bring the mission to a safe state and confirm.',
      ),
      inProgress: phaseCopy('In progress', 'The crew is bringing the mission to a safe state.'),
      confirmed: phaseCopy('Safety confirmed', 'The crew confirmed the mission is in a safe state.'),
      cleaned: phaseCopy(
        'Ready to cancel',
        'Operational resources have been released. The mission can now be cancelled safely.',
      ),
      failed: phaseCopy(
        'Needs another attempt',
        'Check the mission status with the crew before continuing.',
      ),
      unknown: phaseCopy('Status needs checking', 'Refresh the status before continuing.'),
    },
  },
})
