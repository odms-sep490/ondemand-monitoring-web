import { defineMessages } from '../../../../../shared/i18n'

export const mediaPreviewModalMessages = defineMessages({
  vi: {
    loading: 'Đang lấy đường dẫn xem…',
    error: 'Không mở được tệp này.',
    retry: 'Thử lại',
    prev: '← Trước',
    next: 'Sau →',
    detail: 'Xem chi tiết',
    download: 'Tải xuống',
    downloadUnavailable: 'Tệp gốc chỉ tải được sau khi thanh toán đủ và chấp nhận kết quả.',
    downloadFailed: 'Không thể tải tệp gốc. Vui lòng thử lại.',
  },
  en: {
    loading: 'Getting the viewing link…',
    error: 'Unable to open this file.',
    retry: 'Retry',
    prev: '← Previous',
    next: 'Next →',
    detail: 'Open details',
    download: 'Download',
    downloadUnavailable: 'Original media is available after full payment and result acceptance.',
    downloadFailed: 'Unable to download the original file. Please try again.',
  },
})
