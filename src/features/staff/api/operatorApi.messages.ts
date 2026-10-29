import { defineMessages } from '../../../shared/i18n'

export const operatorApiMessages = defineMessages({
  vi: {
    loadFailed: (status: number) =>
      `Không tải được danh sách người vận hành (HTTP ${status})`,
  },
  en: {
    loadFailed: (status: number) => `Failed to load operators (HTTP ${status})`,
  },
})
