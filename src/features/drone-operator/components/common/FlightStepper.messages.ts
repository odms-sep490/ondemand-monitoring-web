import { defineMessages } from '../../../../shared/i18n'

export const flightStepperMessages = defineMessages({
  vi: {
    steps: [
      { key: 'accept', label: 'Nhận' },
      { key: 'ready', label: 'Sẵn sàng' },
      { key: 'connect', label: 'Kết nối' },
      { key: 'preflight', label: 'Trước bay' },
      { key: 'handover', label: 'Bàn giao' },
      { key: 'flight', label: 'Bay' },
      { key: 'postflight', label: 'Sau bay' },
      { key: 'upload', label: 'Nghiệm thu' },
    ],
    progressName: 'Tiến trình chuyến bay',
    completed: 'Đã hoàn thành',
    current: 'Đang thực hiện',
    upcoming: 'Chưa thực hiện',
    stepCounter: (step: number, total: number, label: string) =>
      `Bước ${step}/${total} — ${label}`,
  },
  en: {
    steps: [
      { key: 'accept', label: 'Accept' },
      { key: 'ready', label: 'Ready' },
      { key: 'connect', label: 'Connect' },
      { key: 'preflight', label: 'Preflight' },
      { key: 'handover', label: 'Handover' },
      { key: 'flight', label: 'Flight' },
      { key: 'postflight', label: 'Postflight check' },
      { key: 'upload', label: 'Review' },
    ],
    progressName: 'Flight progress',
    completed: 'Completed',
    current: 'Current step',
    upcoming: 'Upcoming',
    stepCounter: (step: number, total: number, label: string) =>
      `Step ${step} of ${total} — ${label}`,
  },
})
