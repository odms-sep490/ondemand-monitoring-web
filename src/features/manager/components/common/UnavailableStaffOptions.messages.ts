import { defineMessages } from '../../../../shared/i18n'

export const unavailableStaffMessages = defineMessages({
  vi: {
    heading: 'Không khả dụng trong khung giờ này',
    badgeBusy: 'Đã báo bận',
    badgeMission: 'Trùng nhiệm vụ',
    busyDetail: (sessions: string) => `Đã đăng ký bận: ${sessions}`,
    missionDetail: 'Đã được phân công nhiệm vụ khác trong khung giờ này.',
  },
  en: {
    heading: 'Unavailable in this time window',
    badgeBusy: 'Marked busy',
    badgeMission: 'Mission conflict',
    busyDetail: (sessions: string) => `Registered busy: ${sessions}`,
    missionDetail: 'Already assigned to another mission in this time window.',
  },
})
