import { defineMessages } from '../../../../shared/i18n'

export const availabilityPageMessages = defineMessages({
  vi: {
    pageTitle: 'Lịch rảnh',
    pageSubtitle:
      'Mặc định bạn rảnh. Chỉ cần đánh dấu các buổi bận (tối đa 4 buổi mỗi tuần); quản lý sẽ không phân công nhiệm vụ vào buổi bận.',
    freeLabel: 'Rảnh',
    busyLabel: 'Bận',
    hint: 'Bấm vào một buổi để đánh dấu bận hoặc hủy bận. Buổi đã bắt đầu không thể thay đổi.',
    quota: (used: number, max: number) => `Đã dùng ${used}/${max} buổi bận tuần này`,
    quotaFull: 'Đã đạt giới hạn buổi bận của tuần này.',
    loadFailedTitle: 'Không tải được lịch bận',
    loadFailedDesc: 'Mất kết nối hoặc máy chủ đang bận.',
    retry: 'Thử lại',
    prevWeek: 'Tuần trước',
    nextWeek: 'Tuần sau',
    thisWeek: 'Tuần này',
    weekLabel: (from: string, to: string) => `${from} – ${to}`,
    emptyWeekBanner: 'Tuần này bạn chưa đánh dấu buổi bận nào, tức là rảnh cả tuần.',
    markedBusy: 'Đã đánh dấu bận.',
    markedFree: 'Đã hủy lịch bận.',
  },
  en: {
    pageTitle: 'Availability',
    pageSubtitle:
      'You are free by default. Only mark the sessions you are busy (up to 4 per week); managers will not assign missions in busy sessions.',
    freeLabel: 'Free',
    busyLabel: 'Busy',
    hint: 'Click a session to mark it busy or free again. Sessions that already started cannot be changed.',
    quota: (used: number, max: number) => `${used}/${max} busy sessions used this week`,
    quotaFull: 'You reached the busy-session limit for this week.',
    loadFailedTitle: 'Could not load busy schedule',
    loadFailedDesc: 'Connection lost or the server is busy.',
    retry: 'Retry',
    prevWeek: 'Previous week',
    nextWeek: 'Next week',
    thisWeek: 'This week',
    weekLabel: (from: string, to: string) => `${from} – ${to}`,
    emptyWeekBanner: 'No busy sessions this week, so you are free all week.',
    markedBusy: 'Marked as busy.',
    markedFree: 'Busy session cancelled.',
  },
})
