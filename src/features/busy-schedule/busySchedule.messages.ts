import { defineMessages } from '../../shared/i18n'

export const busyScheduleMessages = defineMessages({
  vi: {
    sessions: {
      MORNING: 'Sáng (06:00 – 12:00)',
      AFTERNOON: 'Chiều (12:00 – 18:00)',
      EVENING: 'Tối (18:00 – 22:00)',
    },
    sessionsShort: { MORNING: 'Sáng', AFTERNOON: 'Chiều', EVENING: 'Tối' },
    weekdayShort: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    errors: {
      BUSY_SCHEDULE_NOT_FOUND:
        'Không tìm thấy lịch bận. Có thể lịch đã được hủy; vui lòng tải lại.',
      BUSY_SCHEDULE_WEEKLY_LIMIT_EXCEEDED:
        'Chỉ được đăng ký tối đa 4 buổi bận mỗi tuần (Thứ 2 – Chủ nhật).',
      BUSY_SCHEDULE_DUPLICATE: 'Buổi này đã được đăng ký bận.',
      BUSY_SCHEDULE_MISSION_CONFLICT:
        'Buổi này trùng với nhiệm vụ đã được phân công cho bạn nên không thể đánh dấu bận.',
      STAFF_BUSY_IN_SLOT:
        'Nhân sự đã đăng ký bận trong khung giờ của nhiệm vụ này.',
      BUSY_SCHEDULE_PAST_DATE:
        'Không thể đăng ký hoặc thay đổi lịch bận cho buổi đã bắt đầu hoặc đã qua.',
      ACCESS_DENIED: 'Bạn không có quyền quản lý lịch bận.',
      NETWORK_ERROR: 'Không thể kết nối máy chủ. Vui lòng thử lại.',
    },
    fallbackError: 'Không thể cập nhật lịch bận. Vui lòng thử lại.',
  },
  en: {
    sessions: {
      MORNING: 'Morning (06:00 – 12:00)',
      AFTERNOON: 'Afternoon (12:00 – 18:00)',
      EVENING: 'Evening (18:00 – 22:00)',
    },
    sessionsShort: { MORNING: 'Morning', AFTERNOON: 'Afternoon', EVENING: 'Evening' },
    weekdayShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    errors: {
      BUSY_SCHEDULE_NOT_FOUND:
        'Busy session not found. It may already be cancelled; please reload.',
      BUSY_SCHEDULE_WEEKLY_LIMIT_EXCEEDED:
        'You can register at most 4 busy sessions per week (Mon – Sun).',
      BUSY_SCHEDULE_DUPLICATE: 'This session is already marked busy.',
      BUSY_SCHEDULE_MISSION_CONFLICT:
        'This session overlaps a mission already assigned to you, so it cannot be marked busy.',
      STAFF_BUSY_IN_SLOT:
        'This staff member registered as busy during the mission window.',
      BUSY_SCHEDULE_PAST_DATE:
        'Busy sessions cannot be registered or changed once they have started or passed.',
      ACCESS_DENIED: 'You do not have permission to manage busy schedules.',
      NETWORK_ERROR: 'Cannot reach the server. Please try again.',
    },
    fallbackError: 'Could not update the busy schedule. Please try again.',
  },
})
