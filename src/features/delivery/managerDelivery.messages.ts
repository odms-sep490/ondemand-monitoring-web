import { defineMessages } from '../../shared/i18n'

export const managerDeliveryFeedbackMessages = defineMessages({
  vi: {
    previewReleased: 'Đã gửi kết quả cho khách hàng xem.',
    originalsReleased: 'Đã bàn giao bản gốc cho khách hàng.',
    releaseOriginalsTitle: 'Bàn giao bản gốc?',
    releaseOriginalsBody:
      'Khách hàng sẽ nhận được toàn bộ tệp gốc và không thể thu hồi sau khi bàn giao.',
    releaseOriginalsAction: 'Bàn giao bản gốc',
  },
  en: {
    previewReleased: 'Results sent to the customer for review.',
    originalsReleased: 'Original files delivered to the customer.',
    releaseOriginalsTitle: 'Deliver the original files?',
    releaseOriginalsBody:
      'The customer will receive every original file and delivery cannot be undone.',
    releaseOriginalsAction: 'Deliver originals',
  },
})
