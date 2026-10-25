import { defineMessages } from '../../../../../shared/i18n'

export const scheduleCardMessages = defineMessages({
  vi: {
    cardTitle: 'Lịch bay mong muốn',
    dateRangeHint:
      'Chọn khoảng ngày bạn muốn drone bay. Ngày bay sớm nhất phải cách ngày tạo yêu cầu ít nhất 7 ngày.',
    advanceNoticeTitle: 'Lưu ý đặt lịch: ',
    advanceNoticeBody:
      'Vui lòng đặt lịch trước ít nhất 7 ngày để ODMS có thời gian chuẩn bị hồ sơ và thực hiện thủ tục xin phép bay.',
    startDate: 'Ngày sớm nhất',
    endDate: 'Ngày muộn nhất',
    timeWindow: 'Khung giờ ưu tiên',
    selectTimeWindow: 'Chọn khung giờ',
    noTimes: 'Chưa có khung giờ nào từ hệ thống.',
  },
  en: {
    cardTitle: 'Preferred flight schedule',
    dateRangeHint:
      'Choose the date range when you want the drone to fly. The earliest flight date must be at least 7 days after the request date.',
    advanceNoticeTitle: 'Scheduling note: ',
    advanceNoticeBody:
      'Please schedule at least 7 days in advance so ODMS has time to prepare the required documents and flight permit procedures.',
    startDate: 'Earliest date',
    endDate: 'Latest date',
    timeWindow: 'Preferred time window',
    selectTimeWindow: 'Select a time window',
    noTimes: 'The system has no time windows yet.',
  },
})
