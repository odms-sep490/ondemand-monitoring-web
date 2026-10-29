import { defineMessages } from '../../../../shared/i18n'

export const manualUploadMessages = defineMessages({
  vi: {
    title: 'Tải thủ công tệp media',
    description:
      'Các tệp này cần khôi phục thủ công. Thử lại bản gốc trên Flight Controller hoặc chọn đúng bản sao lưu từ PC.',
    refresh: 'Làm mới',
    backToReview: 'Quay lại duyệt',
    backToMissions: 'Về danh sách nhiệm vụ',
    empty: 'Nhiệm vụ này không có tác vụ tải thủ công.',
    localId: 'ID cục bộ',
    uploading: 'Đang tải lên…',
    startRetry: 'Bắt đầu thử lại thủ công',
    loadFailed: 'Không tải được các tác vụ tải thủ công',
    retryFailed: 'Tải thủ công thất bại',
    pcBackupFailed: 'Tải bản sao lưu từ PC thất bại',
  },
  en: {
    title: 'Manual media upload',
    description:
      'These files require manual recovery. Retry the Flight Controller original or select an exact backup from PC.',
    refresh: 'Refresh',
    backToReview: 'Back to review',
    backToMissions: 'Back to missions',
    empty: 'No manual upload task for this mission.',
    localId: 'local ID',
    uploading: 'Uploading…',
    startRetry: 'Start manual retry',
    loadFailed: 'Cannot load manual upload tasks',
    retryFailed: 'Manual upload failed',
    pcBackupFailed: 'PC backup upload failed',
  },
})
