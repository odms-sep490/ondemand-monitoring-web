import {
  ChecklistGuidance,
  hasChecklistGuidance,
} from '../../../../shared/components/ChecklistGuidance'
import { useI18n } from '../../../../shared/i18n'
import { guidanceMessages } from '../../ManagerPricing/guidance.messages'
import type { CustomerQuote } from '../../types'

/** Only quote-frozen content belongs in the acceptance UI. Never substitute live order guidance. */
export function QuoteGuidance({ quote }: { quote: CustomerQuote }) {
  const { t } = useI18n(guidanceMessages)
  const snapshot = quote.checklistGuidanceSnapshot
  const items = snapshot?.schemaVersion === 1 ? snapshot.items : []
  if (
    !items.length &&
    (snapshot?.schemaVersion === 1 || quote.status !== 'ACCEPTED_BY_CUSTOMER')
  )
    return null
  return (
    <section className="finance-quote-guidance" aria-label={t.quoteTitle}>
      <h3>{t.quoteTitle}</h3>
      {!items.length ? (
        <p>{t.empty}</p>
      ) : (
        items.map((item, index) => (
          <div key={item.itemId}>
            <strong>
              {quote.items.find(
                (line) => line.orderChecklistItemId === item.itemId,
              )?.description ?? t.quoteItem(index + 1)}
            </strong>
            {hasChecklistGuidance(item) ? (
              <ChecklistGuidance guidance={item} defaultOpen />
            ) : (
              <p>{t.empty}</p>
            )}
          </div>
        ))
      )}
    </section>
  )
}
