import { defineMessages } from '../../../../../shared/i18n'

export const mediaViewerMessages = defineMessages({
  vi: {
    noUrl: 'Đường dẫn xem đã hết hạn hoặc chưa sẵn sàng. Hãy tải lại.',
    noPreview: 'Không thể xem trước loại tệp này. Hãy tải xuống.',
    previewProcessing: 'Bản xem trước đang được tạo. Vui lòng thử lại sau.',
    previewFailed: 'Chưa thể tạo bản xem trước cho tệp này.',
    previewUnsupported: 'Định dạng tệp này chưa được hỗ trợ xem trước.',
  },
  en: {
    noUrl: 'The viewing link has expired or is not ready. Please reload.',
    noPreview: 'This file type cannot be previewed. Please download it.',
    previewProcessing: 'The preview is being prepared. Please try again shortly.',
    previewFailed: 'A preview could not be created for this file.',
    previewUnsupported: 'Preview is not supported for this file format.',
  },
})
