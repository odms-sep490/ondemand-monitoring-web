import { defineMessages } from '../../../../../shared/i18n'

export const manualCockpitPreflightMessages = defineMessages({
  vi: {
    title: 'Kiểm tra thủ công',
    items: {
      drone: 'Drone đã bật nguồn',
      gps: 'GPS đã sẵn sàng',
      battery: 'Pin đủ bay demo',
      propeller: 'Cánh quạt an toàn',
      area: 'Khu vực cất cánh thông thoáng',
    },
    continuing: 'Đang qua bước...',
    skip: 'Qua bước này',
  },
  en: {
    title: 'Manual preflight',
    items: {
      drone: 'Drone powered on',
      gps: 'GPS ready',
      battery: 'Battery ready for demo',
      propeller: 'Propellers safe',
      area: 'Takeoff area clear',
    },
    continuing: 'Continuing...',
    skip: 'Skip to flight',
  },
})
