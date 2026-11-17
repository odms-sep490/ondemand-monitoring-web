import { Button } from 'antd'
import {
  ChecklistGuidance,
  hasChecklistGuidance,
} from '../../../../shared/components/ChecklistGuidance'
import { guidanceMessages } from '../guidance.messages'
import type { ChecklistReviewStatus } from '../../types'
import {
  statuses,
  liveSystemPrice,
  initialManagerPrice,
  isManagerPriced,
  amount,
  isOutsidePriceRange,
  MIN_REASON_LENGTH,
} from '../pricingHelpers'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { MoneyInput } from './MoneyInput'
import { PriceDifference } from './PriceDifference'
import type { PricingChecklistItem, PricingReview } from '../../types'
import type { Draft } from '../pricingHelpers'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { pricingMessages } from '../pricing.messages'

export function ChecklistRow({
  item,
  onEditGuidance,
  data,
  accepted,
  updateReview,
  draft,
  setDraft,
  dirtyPriceIds,
  dirtyPriceReasonIds,
  priceRange,
  openNote,
  setOpenNote,
}: {
  item: PricingChecklistItem
  onEditGuidance: (item: PricingChecklistItem) => void
  data: PricingReview
  accepted: boolean
  updateReview: (
    item: PricingChecklistItem,
    status: ChecklistReviewStatus,
    managerNote?: string | undefined,
  ) => Promise<void>
  draft: Draft
  setDraft: Dispatch<SetStateAction<Draft>>
  dirtyPriceIds: RefObject<Set<string>>
  dirtyPriceReasonIds: RefObject<Set<string>>
  priceRange: (system: number) => { min: number; max: number } | null
  openNote: string | null
  setOpenNote: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(pricingMessages)
  const { t: g } = useI18n(guidanceMessages)
  const isCustom = item.sourceType === 'CUSTOMER_CUSTOM'
  const noteOpen = openNote === item.id
  const pending = item.reviewStatus === 'PENDING'
  const system = liveSystemPrice(item, data?.systemCalculation?.items)
  const initialPrice = initialManagerPrice(item, system)
  const range = priceRange(system)
  const proposed = amount(
    draft.prices[item.id] ?? String(initialPrice),
  )
  const outsideRange = isOutsidePriceRange(proposed, system, range)
  const priceReason =
    draft.priceReasons[item.id] ?? item.managerPriceAdjustmentReason ?? ''
  return (
    <div
      className={`finance-requirement is-${item.reviewStatus.toLowerCase()}${noteOpen ? ' is-note-open' : ''}${isCustom ? ' is-customer-custom' : ''}`}
    >
      <span className="finance-index">
        {String(data!.checklistItems.indexOf(item) + 1).padStart(2, '0')}
      </span>
      <div className="finance-requirement-main">
        <strong>{item.content}</strong>
        {isCustom ? (
          <div className="finance-guidance-status">
            <span role="status">
              {item.guidanceReady
                ? g.ready
                : hasChecklistGuidance(item)
                  ? g.draft
                  : g.missing}
            </span>
            {!accepted && item.canEditGuidance === true ? (
              <Button size="small" onClick={() => onEditGuidance(item)}>
                {g.title}
              </Button>
            ) : (
              <small title={g.blocked}>{g.blocked}</small>
            )}
          </div>
        ) : null}
        {item.sourceType !== 'SERVICE_TEMPLATE' ? (
          <span>{t.sourceCustom}</span>
        ) : null}
        {(item.requestedImageCount ?? 0) + (item.requestedVideoCount ?? 0) >
        0 ? (
          <span>
            {t.customerRequested(
              item.requestedImageCount ?? 0,
              item.requestedVideoCount ?? 0,
            )}
          </span>
        ) : null}
      </div>
      {item.sourceType === 'SERVICE_TEMPLATE' ? (
        <div className="finance-zero">{t.includedInPackage}</div>
      ) : (
        <label className="finance-status-select">
          <span className="finance-classify-label">{t.classify}</span>
          <select
            value={item.reviewStatus}
            disabled={accepted}
            onChange={(event) =>
              void updateReview(
                item,
                event.target.value as ChecklistReviewStatus,
              )
            }
          >
            <option value="PENDING" disabled>
              {t.pending}
            </option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="finance-item-price">
        <small className="finance-system-price">
          <span>{t.systemPriceInline}</span>
          <strong>{formatVnd(liveSystemPrice(item, data?.systemCalculation?.items))}</strong>
        </small>
        {isManagerPriced(item) ? (
          <MoneyInput
            label={t.approvedPriceLabel}
            value={
              draft.prices[item.id] ?? String(initialPrice)
            }
            onChange={(value) =>
              setDraft((state) => {
                dirtyPriceIds.current.add(item.id)
                const priceReasons = { ...state.priceReasons }
                if ((state.prices[item.id] ?? String(system)) !== value) {
                  priceReasons[item.id] = ''
                  dirtyPriceReasonIds.current.add(item.id)
                }
                return {
                  ...state,
                  prices: { ...state.prices, [item.id]: value },
                  priceReasons,
                }
              })
            }
            disabled={accepted}
          />
        ) : null}
        {isManagerPriced(item) ? (
          <PriceDifference
            system={system}
            range={range}
            proposed={proposed}
          />
        ) : null}
        {isManagerPriced(item) && outsideRange ? (
          <label className="finance-price-range-reason">
            <span>{t.priceRangeReasonLabel(MIN_REASON_LENGTH)}</span>
            <textarea
              rows={2}
              maxLength={1000}
              value={priceReason}
              disabled={accepted}
              aria-invalid={priceReason.trim().length < MIN_REASON_LENGTH}
              placeholder={t.priceRangeReasonPlaceholder}
              onChange={(event) => {
                dirtyPriceReasonIds.current.add(item.id)
                setDraft((state) => ({
                  ...state,
                  priceReasons: {
                    ...state.priceReasons,
                    [item.id]: event.target.value,
                  },
                }))
              }}
            />
            <small>
              {t.reasonCounter(priceReason.trim().length, MIN_REASON_LENGTH)}
            </small>
          </label>
        ) : null}
      </div>
      {item.sourceType !== 'SERVICE_TEMPLATE' ? (
        <span
          className={`finance-review-badge is-${item.reviewStatus.toLowerCase()}`}
        >
          {item.reviewStatus === 'PENDING'
            ? t.pending
            : isManagerPriced(item) &&
                item.managerApprovedAmount == null &&
                item.managerQuotedPrice == null
              ? t.badgeAwaitingPrice
              : t.badgeReviewed}
        </span>
      ) : null}
      <button
        type="button"
        className="finance-chevron"
        aria-label={t.noteAria(item.content)}
        aria-expanded={noteOpen}
        onClick={() => setOpenNote(openNote === item.id ? null : item.id)}
      >
        <span aria-hidden="true">⌄</span>
      </button>
      {hasChecklistGuidance(item) && (
        <div className="finance-requirement-guidance">
          <ChecklistGuidance guidance={item} summaryLabel={t.workDetails} />
        </div>
      )}
      {noteOpen ? (
        <div className="finance-note">
          {pending ? (
            <>
              <strong>{t.managerNote}</strong>
              <small>{item.managerNote || t.notePlaceholderPending}</small>
            </>
          ) : (
            <>
              <label htmlFor={`finance-note-${item.id}`}>{t.managerNote}</label>
              <input
                id={`finance-note-${item.id}`}
                defaultValue={item.managerNote ?? ''}
                disabled={accepted}
                placeholder={t.notePlaceholderReason}
                onBlur={(event) =>
                  void updateReview(item, item.reviewStatus, event.target.value)
                }
              />
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
