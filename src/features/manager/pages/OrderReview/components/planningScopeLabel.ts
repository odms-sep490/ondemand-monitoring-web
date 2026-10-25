import type { Language } from '../../../../../shared/i18n'

const WHOLE_ORDER_SCOPE_LABELS = new Set([
  'Whole Order scope',
  'Entire Order scope',
  'Toàn bộ phạm vi Order',
  'Toàn bộ phạm vi đơn hàng',
])

export function localizePlanningScopeLabel(
  label: string | null | undefined,
  lang: Language,
): string {
  const value = label?.trim()
  if (!value) return lang === 'en' ? 'Mission history' : 'Lịch sử nhiệm vụ'
  if (!WHOLE_ORDER_SCOPE_LABELS.has(value)) return value
  return lang === 'en' ? 'Entire order scope' : 'Toàn bộ phạm vi đơn hàng'
}
