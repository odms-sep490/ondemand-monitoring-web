import { useI18n } from '../../../../shared/i18n'
import { customerFinanceSectionsMessages } from '../CustomerFinanceSections.messages'
import type { CustomerQuote } from '../../types'
import { pricingDescription } from '../../../../shared/lib/pricingPresentation'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { lineText } from '../customerFinanceHelpers'

/** Quote lines grouped per checklist (heading + subtotal), then the order-level lines. */
export function QuoteLines({ items }: { items: CustomerQuote['items'] }) {
  const { t } = useI18n(customerFinanceSectionsMessages)
  const lines = items.filter((item) => item.type !== 'ADJUSTMENT')
  const groups = new Map<string, CustomerQuote['items']>()
  const orderLevel: CustomerQuote['items'] = []
  for (const line of lines) {
    if (!line.orderChecklistItemId) {
      orderLevel.push(line)
      continue
    }
    groups.set(line.orderChecklistItemId, [
      ...(groups.get(line.orderChecklistItemId) ?? []),
      line,
    ])
  }
  const sum = (rows: CustomerQuote['items']) =>
    rows.reduce((total, row) => total + row.amount, 0)
  return (
    <div className="customer-quote-groups">
      {[...groups.entries()].map(([id, rows]) => {
        const name =
          pricingDescription(rows[0].description).split(' · ')[0] || t.contentFallback
        return (
          <details key={id} className="customer-quote-group">
            <summary>
              <strong title={name}>{name}</strong>
              <b>{formatVnd(sum(rows))}</b>
              <span className="customer-quote-detail-label">{t.priceDetails}</span>
            </summary>
            <ul>
              {rows.map((row) => (
                <li key={row.id}>
                  <span>{lineText(row, name, t.adjustment)}</span>
                  <span>{formatVnd(row.amount)}</span>
                </li>
              ))}
            </ul>
          </details>
        )
      })}
      {orderLevel.length === 1 ? (
        <div className="customer-quote-group customer-quote-group--static">
          <div className="customer-quote-group-summary">
            <strong>{lineText(orderLevel[0], undefined, t.adjustment)}</strong>
            <b>{formatVnd(orderLevel[0].amount)}</b>
          </div>
        </div>
      ) : orderLevel.length > 1 ? (
        <details className="customer-quote-group">
          <summary>
            <strong>{t.perOrder}</strong>
            <b>{formatVnd(sum(orderLevel))}</b>
            <span className="customer-quote-detail-label">{t.priceDetails}</span>
          </summary>
          <ul>
            {orderLevel.map((row) => (
              <li key={row.id}>
                <span>{lineText(row, undefined, t.adjustment)}</span>
                <span>{formatVnd(row.amount)}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}
