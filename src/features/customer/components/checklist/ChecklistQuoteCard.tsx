import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { ServicePricePreview } from '../../../../shared/api/checklistPricingApi'
import { checklistMessages } from '../../lib/checklist/messages'
import type { ChecklistQuoteState } from '../../lib/checklist/useChecklistQuote'

/**
 * How the price of the current selection adds up, folded away by default: each row already shows its own price and the
 * summary panel shows the total. Always computed by the backend; the client only sends which checklists it wants and
 * how many images/videos, so it has no way to send a price. Customers see the Base Checklist formula and area inputs.
 */
export function ChecklistQuoteCard({
  quote,
  showSummaryTotal = true,
}: {
  quote: ChecklistQuoteState
  showSummaryTotal?: boolean
}) {
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
      {quote.preview && (
        <QuoteDetails
          preview={quote.preview}
          showSummaryTotal={showSummaryTotal}
        />
      )}
    </div>
  )
}

function QuoteDetails({
  preview,
  showSummaryTotal,
}: {
  preview: ServicePricePreview
  showSummaryTotal: boolean
}) {
  const { t } = useI18n(checklistMessages)
  return (
    <details className="checklist-quote-details" open>
      <summary>
        <span>{t.quoteTitle}</span>
        {showSummaryTotal && <strong>{formatVnd(preview.total)}</strong>}
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
              row.calculationDisplay != null ? (
                <>
                  <dl className="checklist-quote-calculation">
                    <div>
                      <dt>{t.basePriceLabel}</dt>
                      <dd>{formatVnd(row.basePrice ?? 0)}</dd>
                    </div>
                    <div>
                      <dt>{t.standardAreaLabel}</dt>
                      <dd>{formatArea(row.standardAreaM2)} m²</dd>
                    </div>
                    <div>
                      <dt>{t.actualAreaLabel}</dt>
                      <dd>{formatArea(row.actualAreaM2)} m²</dd>
                    </div>
                    <div className="is-calculation">
                      <dt>
                        {row.actualAreaM2 != null &&
                        row.standardAreaM2 != null &&
                        row.actualAreaM2 > row.standardAreaM2
                          ? t.excessAreaLabel
                          : t.calculationLabel}
                      </dt>
                      <dd>{row.calculationDisplay}</dd>
                    </div>
                  </dl>
                  {row.lines.some(
                    (line) => line.amount !== 0 && line.category === 'MEDIA',
                  ) && (
                    <ul>
                      {row.lines
                        .filter(
                          (line) =>
                            line.amount !== 0 && line.category === 'MEDIA',
                        )
                        .map((line, lineIndex) => (
                          <li key={`${line.component}-${lineIndex}`}>
                            <span>{line.description}</span>
                            <span>{formatVnd(line.amount)}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </>
              ) : (
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
              )
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

function formatArea(value?: number | null) {
  return value == null
    ? '—'
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value)
}
