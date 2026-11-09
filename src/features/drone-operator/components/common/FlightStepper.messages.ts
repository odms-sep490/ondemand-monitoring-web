import { defineMessages } from '../../../../shared/i18n'

export const flightStepperMessages = defineMessages({
  vi: {
    steps: [
      { key: 'accept', label: 'Nhận' },
      { key: 'ready', label: 'Sẵn sàng' },
      { key: 'connect', label: 'Kết nối' },
      { key: 'preflight', label: 'Kiểm tra trước bay' },
      { key: 'handover', label: 'Bàn giao' },
      { key: 'flight', label: 'Bay' },
      { key: 'postflight', label: 'Kiểm tra sau bay' },
      { key: 'upload', label: 'Nghiệm thu' },
    ],
    progressName: 'Tiến trình chuyến bay',
    completed: 'Đã hoàn thành',
    current: 'Đang thực hiện',
    upcoming: 'Chưa thực hiện',
    finished: 'Đã hoàn tất toàn bộ quy trình',
    failed: 'Đã thất bại',
    failedSummary: 'Quy trình đã kết thúc do nhiệm vụ thất bại',
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
    finished: 'All steps completed',
    failed: 'Failed',
    failedSummary: 'Workflow ended because the mission failed',
    stepCounter: (step: number, total: number, label: string) =>
      `Step ${step} of ${total} — ${label}`,
  },
})
