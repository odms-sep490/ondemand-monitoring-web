import { defineMessages } from '../../../../../shared/i18n'

export const droneStatusDonutMessages = defineMessages({
  vi: {
    ariaLabel: (total: number, summary: string) =>
      `Trạng thái đội drone: ${total} drone. ${summary}.`,
    unit: 'drone',
  },
  en: {
    ariaLabel: (total: number, summary: string) =>
      `Drone fleet status: ${total} drones. ${summary}.`,
    unit: 'drones',
  },
})
