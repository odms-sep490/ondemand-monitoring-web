import { defineMessages } from '../../../../../shared/i18n'

export const scheduleOptionsCardMessages = defineMessages({
  vi: {
    cardTitle: 'Tùy chọn lịch bay',
    cardHint: 'Không bắt buộc. Bỏ qua nếu bạn chỉ cần bay một lần.',
    repeatLegend: 'Lặp lại định kỳ',
    repeat: { NONE: 'Một lần', WEEKLY: 'Hằng tuần', MONTHLY: 'Hằng tháng' },
    occurrences: 'Tổng số chuyến bay',
    occurrencesHint: (type: 'WEEKLY' | 'MONTHLY', n: number) =>
      `${n} chuyến, mỗi ${type === 'WEEKLY' ? 'tuần' : 'tháng'} một chuyến (2–52).`,
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
    deadline: 'Hạn chót cần có kết quả',
    deadlineOptional: '(không bắt buộc)',
    deadlineHint:
      'Chọn ngày bạn cần nhận kết quả, từ ngày bay muộn nhất trở đi.',
  },
  en: {
    cardTitle: 'Schedule options',
    cardHint: 'Optional. Skip this if you only need a single flight.',
    repeatLegend: 'Repeat',
    repeat: { NONE: 'Once', WEEKLY: 'Weekly', MONTHLY: 'Monthly' },
    occurrences: 'Total number of flights',
    occurrencesHint: (type: 'WEEKLY' | 'MONTHLY', n: number) =>
      `${n} flights, one every ${type === 'WEEKLY' ? 'week' : 'month'} (2–52).`,
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
    deadline: 'Result deadline',
    deadlineOptional: '(optional)',
    deadlineHint:
      'Pick the date you need the result by, on or after the latest flight date.',
  },
})
