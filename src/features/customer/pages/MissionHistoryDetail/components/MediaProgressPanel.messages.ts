import { defineMessages } from '../../../../../shared/i18n'

export const mediaProgressPanelMessages = defineMessages({
  vi: {
    available: 'Sẵn sàng',
    processing: 'Đang xử lý',
    rejected: 'Không đạt',
    processingNote: (n: number) =>
      `Kết quả đang được xử lý: ${n} tệp đang chờ tải lên, thử lại hoặc xác thực.`,
    rejectedNote: (n: number) =>
      `${n} tệp chưa đạt xác thực và không được công bố.`,
  },
  en: {
    available: 'Available',
    processing: 'Processing',
    rejected: 'Rejected',
    processingNote: (n: number) =>
      `Results are being processed: ${n} file(s) waiting for upload, retry or validation.`,
    rejectedNote: (n: number) =>
      `${n} file(s) failed validation and are not published.`,
  },
})
