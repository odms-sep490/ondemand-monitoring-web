import { defineMessages } from '../../../../shared/i18n'

export const liveDispatchHelpersMessages = defineMessages({
  vi: {
    preferredTimes: {
      MORNING: 'Buổi sáng',
      AFTERNOON: 'Buổi chiều',
      EVENING: 'Buổi tối',
      NIGHT: 'Buổi đêm',
      ANY_TIME: 'Bất kỳ lúc nào',
    } as Record<string, string>,
  },
  en: {
    preferredTimes: {
      MORNING: 'Morning',
      AFTERNOON: 'Afternoon',
      EVENING: 'Evening',
      NIGHT: 'Night',
      ANY_TIME: 'Any time',
    } as Record<string, string>,
  },
})
