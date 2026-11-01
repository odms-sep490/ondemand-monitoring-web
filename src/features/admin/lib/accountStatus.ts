import type { StatusTone } from '../../../shared/types/domain'
import type { AccountStatus } from '../types/accounts'
import { localeOf, type Language } from '../../../shared/i18n'
import { accountStatusMessages } from './accountStatus.messages'

type Meta = { label: string; tone: StatusTone }

const ACCOUNT_STATUS_TONE: Record<AccountStatus, StatusTone> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  PENDING: 'yellow',
}

export function getAccountStatusMeta(
  status: AccountStatus,
  lang: Language = 'vi',
): Meta {
  return {
    label: accountStatusMessages[lang][status],
    tone: ACCOUNT_STATUS_TONE[status],
  }
}

export function fmtDateTime(iso: string, lang: Language = 'vi'): string {
  return new Date(iso).toLocaleString(localeOf(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtDate(iso: string, lang: Language = 'vi'): string {
  return new Date(iso).toLocaleDateString(localeOf(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
