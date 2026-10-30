import { defineMessages } from '../../../../shared/i18n'

export const missionDetailPageMessages = defineMessages({
  vi: {
    errorTitle: 'Không tải được mission',
    errorDescription: 'Mission có thể không tồn tại hoặc đã bị xoá.',
    backToList: 'Về danh sách',
    responseAccessLoading: 'Đang xác nhận quyền nhận nhiệm vụ…',
    responseAccessError:
      'Không tải được quyền nhận nhiệm vụ. Hệ thống sẽ tự thử lại.',
    responseAccessDenied: 'Bạn chưa có quyền phản hồi nhiệm vụ này.',
  },
  en: {
    errorTitle: 'Could not load the mission',
    errorDescription: 'The mission may not exist or has been deleted.',
    backToList: 'Back to list',
    responseAccessLoading: 'Checking assignment permissions…',
    responseAccessError:
      'Could not load assignment permissions. The system will retry automatically.',
    responseAccessDenied:
      'You do not have permission to respond to this assignment.',
  },
})
