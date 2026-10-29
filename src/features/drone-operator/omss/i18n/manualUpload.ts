import { defineMessages } from '../../../../shared/i18n'

export const manualUploadMessages = defineMessages({
  vi: {
    title: 'Tải thủ công tệp media',
    description:
      'Các tệp này đã hết số lần thử tự động. Bản gốc vẫn còn trên Flight Controller để người vận hành kích hoạt thử lại.',
    refresh: 'Làm mới',
    backToReview: 'Quay lại kiểm tra',
    backToMissions: 'Quay lại danh sách nhiệm vụ',
    noTasks: 'Không có tác vụ tải thủ công cho nhiệm vụ này.',
    localId: 'ID cục bộ',
    uploading: 'Đang tải lên…',
    startRetry: 'Bắt đầu thử lại thủ công',
    cannotLoadTasks: 'Không thể tải danh sách tác vụ tải thủ công',
    uploadFailed: 'Tải thủ công thất bại',
  },
  en: {
    title: 'Manual media upload',
    description:
      'These files exhausted automatic attempts. The original remains on the Flight Controller for an operator-triggered retry.',
    refresh: 'Refresh',
    backToReview: 'Back to review',
    backToMissions: 'Back to missions',
    noTasks: 'No manual upload task for this mission.',
    localId: 'local ID',
    uploading: 'Uploading…',
    startRetry: 'Start manual retry',
    cannotLoadTasks: 'Cannot load manual upload tasks',
    uploadFailed: 'Manual upload failed',
  },
})
