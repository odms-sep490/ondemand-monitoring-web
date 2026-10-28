import { defineMessages } from '../../../../../shared/i18n'

export const reviewStageActionsMessages = defineMessages({
  vi: {
    nextDefault: 'Tiếp: Điều kiện duyệt',
    back: 'Quay lại',
    step: (step: number, total: number) => `Bước ${step}/${total}`,
  },
  en: {
    nextDefault: 'Next: Approval criteria',
    back: 'Back',
    step: (step: number, total: number) => `Step ${step}/${total}`,
  },
})
