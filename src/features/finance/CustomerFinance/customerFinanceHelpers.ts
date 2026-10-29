import { ApiError } from '../../../shared/api/httpClient'
import { customerFinancePanelMessages } from './CustomerFinancePanel.messages'
import type { CustomerQuote } from '../types'
import { pricingDescription } from '../../../shared/lib/pricingPresentation'

export function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

export function messageOf(
  error: unknown,
  t: (typeof customerFinancePanelMessages)['vi'],
) {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') {
      return t.networkError
    }
    if (error.code === 'PAYMENT_PROVIDER_ERROR') {
      return t.paymentProviderError
    }
    const messages = t.apiErrors
    if (error.code && messages[error.code]) {
      return messages[error.code]
    }
    return t.loadError
  }
  return error instanceof Error ? error.message : t.loadError
}

export function lineText(
  row: CustomerQuote['items'][number],
  checklistName?: string,
  adjustmentLabel = 'Điều chỉnh đã được phê duyệt',
) {
  if (row.type === 'MANAGER_ADJUSTMENT') {
    const reason = row.description.split(' · ').slice(1).join(' · ')
    return reason
      ? `${adjustmentLabel}: ${reason}`
      : adjustmentLabel
  }
  const text = pricingDescription(row.description)
  const prefix = checklistName ? `${checklistName} · ` : ''
  return prefix && text.startsWith(prefix) ? text.slice(prefix.length) : text
}
