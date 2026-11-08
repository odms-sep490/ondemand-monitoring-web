import { defineMessages } from '../../../../../shared/i18n'

export const mediaCardMessages = defineMessages({
  vi: {
    open: (name: string) => `Xem ${name}`,
    view: 'Xem media',
    locked: 'Bản gốc chưa được bàn giao',
    previewProcessing: 'Đang tạo bản xem trước',
    previewFailed: 'Chưa tạo được bản xem trước',
    previewUnsupported: 'Định dạng chưa hỗ trợ xem trước',
  },
  en: {
    open: (name: string) => `View ${name}`,
    view: 'View media',
    locked: 'Original not delivered yet',
    previewProcessing: 'Preparing preview',
    previewFailed: 'Preview could not be created',
    previewUnsupported: 'Preview format is not supported',
  },
})
