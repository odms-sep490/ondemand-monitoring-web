import { defineMessages } from '../../../../../shared/i18n'

export const stopFlowActionsMessages = defineMessages({
  vi: {
    cancelMission: (code: string) => `Hủy nhiệm vụ ${code}`,
    replaceMission: (code: string) => `Thay thế nhiệm vụ ${code}`,
  },
  en: {
    cancelMission: (code: string) => `Cancel Mission ${code}`,
    replaceMission: (code: string) => `Replace Mission ${code}`,
  },
})
