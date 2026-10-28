import type { PricingChecklistItem } from '../../types'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { pricingDescription } from '../../../../shared/lib/pricingPresentation'
import { useI18n } from '../../../../shared/i18n'
import { pricingMessages } from '../pricing.messages'

/** System price lines grouped per checklist (with a subtotal each), then the order-level lines. */
export function QuoteBreakdown({
  items,
  checklistItems,
}: {
  items: Array<{
    category: string
    description: string
    amount: number
    orderChecklistItemId?: string | null
  }>
  checklistItems: PricingChecklistItem[]
}) {
  const { t } = useI18n(pricingMessages)
  const groups = new Map<string, typeof items>()
  const orderLevel: typeof items = []
  for (const item of items) {
    const id = item.orderChecklistItemId
    if (!id) {
      orderLevel.push(item)
      continue
    }
    groups.set(id, [...(groups.get(id) ?? []), item])
  }
  if (items.length === 0) return null
  return (
    <div className="finance-breakdown" aria-label={t.breakdownAria}>
      {[...groups.entries()].map(([id, lines]) => {
        const name =
          checklistItems.find((entry) => entry.id === id)?.content ??
          t.breakdownFallbackName
        const subtotal = lines.reduce((sum, line) => sum + line.amount, 0)
        return (
          <section key={id} className="finance-breakdown-group">
            <header>
              <strong title={name}>{name}</strong>
              <b>{formatVnd(subtotal)}</b>
            </header>
            <ul>
              {lines.map((line, index) => (
                <li key={`${line.category}-${index}`}>
                  <span>{lineLabel(line.description, name)}</span>
                  <span>{formatVnd(line.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {orderLevel.length > 0 && (
        <section className="finance-breakdown-group">
          <header>
            <strong>{t.breakdownOrderLevel}</strong>
            <b>
              {formatVnd(
                orderLevel.reduce((sum, line) => sum + line.amount, 0),
              )}
            </b>
          </header>
          <ul>
            {orderLevel.map((line, index) => (
              <li key={`${line.category}-${index}`}>
                <span>{pricingDescription(line.description)}</span>
                <span>{formatVnd(line.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** Engine descriptions are "<checklist> · <line>"; inside a group the checklist name is already the heading. */
export function lineLabel(description: string, checklistName: string) {
  const text = pricingDescription(description)
  const prefix = `${checklistName.length <= 80 ? checklistName : checklistName.slice(0, 77) + '...'} · `
  return text.startsWith(prefix) ? text.slice(prefix.length) : text
}
