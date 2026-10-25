import { defineMessages } from '../../../../../shared/i18n'

export const mediaCardMessages = defineMessages({
  vi: {
    open: (name: string) => `Xem ${name}`,
    view: 'Xem media',
    locked: 'Bản gốc chưa được bàn giao',
  },
  en: {
    open: (name: string) => `View ${name}`,
    view: 'View media',
    locked: 'Original not delivered yet',
  },
})
