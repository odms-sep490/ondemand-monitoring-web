import { defineMessages } from '../../../../shared/i18n'

export const flightStepperMessages = defineMessages({
  vi: {
    steps: [
      { key: 'accept', label: 'Nhận' },
      { key: 'ready', label: 'Sẵn sàng' },
      { key: 'connect', label: 'Kết nối' },
      { key: 'preflight', label: 'Preflight' },
      { key: 'handover', label: 'Bàn giao' },
      { key: 'flight', label: 'Bay' },
      { key: 'postflight', label: 'Postcheck' },
      { key: 'upload', label: 'Nghiệm thu' },
    ],
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
  },
})
