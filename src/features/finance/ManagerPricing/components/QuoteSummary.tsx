import { QuoteBreakdown } from './QuoteBreakdown'
import { SummaryRow } from './SummaryRow'
import { MIN_REASON_LENGTH } from '../pricingHelpers'
import type { Draft } from '../pricingHelpers'
import type { Dispatch, SetStateAction } from 'react'
import type { PricingReview } from '../../types'
import { Button } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { pricingMessages } from '../pricing.messages'
import { OrderIcon } from '../../../manager/components/common/OrderIcon'

export function QuoteSummary({
  systemPrice,
  checklistAdjustment,
  total,
  reviewComplete,
  pendingReviewCount,
  draft,
  accepted,
  setDraft,
  error,
  message,
  busy,
  approved,
  pendingCustomCount,
  outOfRangeCount,
  adjustmentReasonRequired,
  approveBlockedReason,
  approve,
  data,
}: {
  systemPrice: number
  checklistAdjustment: number
  total: number
  reviewComplete: boolean
  pendingReviewCount: number
  draft: Draft
  accepted: boolean
  setDraft: Dispatch<SetStateAction<Draft>>
  error: string | null
  message: string | null
  busy: boolean
  approved: boolean
  pendingCustomCount: number
  outOfRangeCount: number
  adjustmentReasonRequired: boolean
  approveBlockedReason: string | null | undefined
  approve: () => Promise<void>
  data: PricingReview
}) {
  const { t } = useI18n(pricingMessages)
  const prepareDisabled = busy || approved || pendingCustomCount > 0 || outOfRangeCount > 0 || Boolean(approveBlockedReason)
  const prepareHint = pendingCustomCount > 0 ? t.approveTitlePending : outOfRangeCount > 0 ? t.approveTitleOutOfRange : (approveBlockedReason ?? undefined)
  return (
    <aside className="odm-or-card finance-quote" aria-label={t.summaryAria}>
      <header className="finance-heading finance-quote-heading">
        <div className="finance-heading-title">
          <span className="finance-heading-icon">
            <OrderIcon name="doc" size={18} />
          </span>
          <h2>{t.summaryTitle}</h2>
        </div>
      </header>
      <div className="finance-quote-body">
        <div className="finance-quote-content">

          <QuoteBreakdown
            items={data.systemCalculation?.items ?? []}
            checklistItems={data.checklistItems}
          />
          <dl className="finance-summary" title={t.systemPriceSourceHint}>
            <SummaryRow label={t.systemPrice} value={systemPrice} />
            <SummaryRow
              label={t.adjustment}
              value={checklistAdjustment}
              signed
              tone={
                checklistAdjustment > 0
                  ? 'up'
                  : checklistAdjustment < 0
                    ? 'down'
                    : undefined
              }
            />
            <SummaryRow label={t.quoteTotal} value={total} total />
          </dl>
          {!reviewComplete && (
            <p className="finance-block-hint">
              {t.remainingToReview(pendingReviewCount)}
            </p>
          )}
          {adjustmentReasonRequired || draft.adjustmentReason ? (
            <label className="finance-quote-note">
              <span>
                {t.adjustmentReasonLabel}
                <em>
                  {adjustmentReasonRequired
                    ? t.adjustmentReasonHint(MIN_REASON_LENGTH)
                    : t.adjustmentReasonOptionalHint}
                </em>
              </span>
              <textarea
                rows={3}
                value={draft.adjustmentReason}
                disabled={accepted}
                aria-invalid={
                  adjustmentReasonRequired &&
                  draft.adjustmentReason.trim().length < MIN_REASON_LENGTH
                }
                onChange={(event) =>
                  setDraft((state) => ({
                    ...state,
                    adjustmentReason: event.target.value,
                  }))
                }
              />
              <small>
                {t.reasonCounter(
                  draft.adjustmentReason.trim().length,
                  MIN_REASON_LENGTH,
                )}
              </small>
            </label>
          ) : null}
          <label className="finance-quote-note">
            <span>{t.quoteNoteLabel}</span>
            <textarea
              rows={3}
              maxLength={500}
              placeholder={t.quoteNotePlaceholder}
              value={draft.managerNote}
              disabled={accepted}
              onChange={(event) =>
                setDraft((state) => ({
                  ...state,
                  managerNote: event.target.value,
                }))
              }
            />
            <small>{draft.managerNote.length}/500</small>
          </label>
          {error ? (
            <p className="finance-alert is-error" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p
              className="finance-alert is-success"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          ) : null}
          {!accepted ? (
            <div className="finance-actions">
              <Button
                id="manager-approve-quote"
                variant="primary"
                type="button"
                disabled={prepareDisabled}
                title={prepareHint}
                onClick={() => void approve()}
              >
                {approved ? t.approved : t.approve}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
