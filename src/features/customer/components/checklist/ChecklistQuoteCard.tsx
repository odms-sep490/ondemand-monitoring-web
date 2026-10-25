import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { ServicePricePreview } from '../../../../shared/api/checklistPricingApi'
import { checklistMessages } from '../../lib/checklist/messages'
import type { ChecklistQuoteState } from '../../lib/checklist/useChecklistQuote'

/**
 * How the price of the current selection adds up, folded away by default: each row already shows its own price and the
 * summary panel shows the total. Always computed by the backend; the client only sends which checklists it wants and
 * how many images/videos, so it has no way to send a price. Pricing profiles, quantities and unit prices are not shown
 * to the customer.
 */
export function ChecklistQuoteCard({ quote }: { quote: ChecklistQuoteState }) {
  const { t } = useI18n(checklistMessages)
  return (
    <div className="checklist-quote">
      {quote.loading && (
        <p role="status" className="checklist-hint">
          {t.quoteLoading}
        </p>
      )}
      {quote.error && (
        <p role="alert" className="co-notice is-danger">
          {quote.error.message}
        </p>
      )}
      {quote.preview && <QuoteDetails preview={quote.preview} />}
    </div>
  )
}

function QuoteDetails({ preview }: { preview: ServicePricePreview }) {
  const { t } = useI18n(checklistMessages)
  return (
    <details className="checklist-quote-details">
      <summary>
        <span>{t.quoteTitle}</span>
        <strong>{formatVnd(preview.total)}</strong>
      </summary>
      <div className="checklist-quote-body">
        <p className="checklist-hint">{t.quoteHint}</p>
        {(preview.occurrences ?? 1) > 1 && (
          <p className="checklist-hint">
            {t.quoteOccurrences(preview.occurrences ?? 1)}
          </p>
        )}
        {preview.warnings.length > 0 && (
          <div role="alert" className="co-notice is-danger">
            <ul>
              {preview.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        {preview.checklists.map((row, index) => (
          <section
            key={`${row.checklistId ?? 'custom'}-${index}`}
            className="checklist-quote-line"
            aria-label={row.content}
          >
            <header>
              <strong>{row.content}</strong>
              <span>
                {row.quotePending ? t.quoteAwaiting : formatVnd(row.subtotal)}
              </span>
            </header>
            {!row.quotePending && (
              <ul>
                {row.lines
                  .filter((line) => line.amount !== 0)
                  .map((line, lineIndex) => (
                    <li key={`${line.component}-${lineIndex}`}>
                      <span>{line.description}</span>
                      <span>{formatVnd(line.amount)}</span>
                    </li>
                  ))}
              </ul>
            )}
            {(row.extraImageCount > 0 || row.extraVideoCount > 0) && (
              <small className="checklist-hint">
                {t.extraMedia(row.extraImageCount, row.extraVideoCount)}
              </small>
            )}
          </section>
        ))}
        {(preview.addOns ?? []).map((addOn) => (
          <div className="checklist-quote-sum" key={addOn.key}>
            <span>
              {t.quoteAddOns}: {addOn.description}
            </span>
            <strong>{formatVnd(addOn.amount)}</strong>
          </div>
        ))}
        <div className="checklist-quote-sum is-total">
          <span>{t.quoteTotal}</span>
          <strong>{formatVnd(preview.total)}</strong>
        </div>
        <p className="checklist-hint">{t.quoteNote}</p>
      </div>
    </details>
  )
}
