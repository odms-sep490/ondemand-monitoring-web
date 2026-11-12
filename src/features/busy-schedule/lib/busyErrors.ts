import { ApiError } from '../../../shared/api/httpClient'
import { getLanguage } from '../../../shared/i18n'
import { busyScheduleMessages } from '../busySchedule.messages'

/** Localized text for a BE busy-schedule / staff-busy error code. */
export function busyScheduleErrorMessage(error: unknown): string {
  const t = busyScheduleMessages[getLanguage()]
  if (error instanceof ApiError && error.code) {
    const known = (t.errors as Record<string, string>)[error.code]
    if (known) return known
  }
  return t.fallbackError
}
