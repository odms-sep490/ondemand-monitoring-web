import { defineMessages } from '../../../../../shared/i18n'

export const missionStatusChartMessages = defineMessages({
  vi: {
    empty: 'Chưa có mission trong 7 ngày qua',
    ariaLabel: (summary: string) =>
      `Mission theo trạng thái 7 ngày gần nhất. ${summary}.`,
    caption: 'Mission theo trạng thái, 7 ngày gần nhất',
    day: 'Ngày',
  },
  en: {
    empty: 'No missions in the last 7 days',
    ariaLabel: (summary: string) =>
      `Missions by status, last 7 days. ${summary}.`,
    caption: 'Missions by status, last 7 days',
    day: 'Date',
  },
})
