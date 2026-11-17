import { defineMessages } from '../../../../../shared/i18n'

export const scheduleOptionsCardMessages = defineMessages({
  vi: {
    cardTitle: 'Tùy chọn lịch bay',
    expandTitle: 'Tùy chọn nâng cao',
    cardHint: 'Tùy chọn cách xử lý khi chuyến bay không thể thực hiện.',
    weatherLegend: 'Nếu chuyến bay không thực hiện được',
    weatherHint:
      'Do thời tiết xấu, thiết bị gặp sự cố hoặc không vào được hiện trường.',
    weather: {
      AUTO_RESCHEDULE: {
        title: 'Tự dời lịch',
        desc: 'Dời sang ngày phù hợp gần nhất trong khoảng ngày bạn chọn.',
      },
      CONTACT_CUSTOMER: {
        title: 'Hỏi tôi',
        desc: 'Liên hệ bạn trước khi thay đổi lịch.',
      },
      CANCEL_ORDER: {
        title: 'Hủy yêu cầu',
        desc: 'Không bay lại và hủy yêu cầu.',
      },
    },
  },
  en: {
    cardTitle: 'Schedule options',
    expandTitle: 'Advanced options',
    cardHint: 'Choose what to do if the flight cannot go ahead.',
    weatherLegend: 'If the flight cannot go ahead',
    weatherHint:
      'Because of bad weather, equipment trouble or blocked site access.',
    weather: {
      AUTO_RESCHEDULE: {
        title: 'Reschedule',
        desc: 'Move to the nearest suitable day inside your date range.',
      },
      CONTACT_CUSTOMER: {
        title: 'Ask me',
        desc: 'Contact you before changing the schedule.',
      },
      CANCEL_ORDER: {
        title: 'Cancel',
        desc: 'Do not fly again and cancel the request.',
      },
    },
  },
})
