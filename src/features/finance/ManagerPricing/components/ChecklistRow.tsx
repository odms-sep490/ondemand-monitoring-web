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
  isManagerPriced,
  amount,
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
  priceRange: (system: number) => { min: number; max: number } | null
  openNote: string | null
  setOpenNote: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(pricingMessages)
  const { t: g } = useI18n(guidanceMessages)
  return (
    <div
      className={`finance-requirement is-${item.reviewStatus.toLowerCase()}`}
    >
      <span className="finance-index">
        {String(data!.checklistItems.indexOf(item) + 1).padStart(2, '0')}
      </span>
      <div className="finance-requirement-main">
        <strong>{item.content}</strong>
        {item.sourceType === 'CUSTOMER_CUSTOM' ? (
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
        <ChecklistGuidance guidance={item} />
        <span>
          {item.sourceType === 'SERVICE_TEMPLATE'
            ? t.sourceTemplate
            : t.sourceCustom}
        </span>
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
          <span className="finance-sr">{t.classify}</span>
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
        <small>
          {t.systemPriceInline}
          {formatVnd(liveSystemPrice(item, data?.systemCalculation?.items))}
        </small>
        {isManagerPriced(item) ? (
          <MoneyInput
            label={t.approvedPriceLabel}
            value={
              draft.prices[item.id] ??
              String(
                item.managerApprovedAmount ??
                  item.managerQuotedPrice ??
                  liveSystemPrice(item, data?.systemCalculation?.items),
              )
            }
            onChange={(value) =>
              setDraft((state) => {
                dirtyPriceIds.current.add(item.id)
                return {
                  ...state,
                  prices: { ...state.prices, [item.id]: value },
                }
              })
            }
            disabled={accepted}
          />
        ) : null}
        {isManagerPriced(item) ? (
          <PriceDifference
            system={liveSystemPrice(item, data?.systemCalculation?.items)}
            range={priceRange(
              liveSystemPrice(item, data?.systemCalculation?.items),
            )}
            proposed={amount(
              draft.prices[item.id] ??
                String(
                  item.managerApprovedAmount ??
                    item.managerQuotedPrice ??
                    liveSystemPrice(item, data?.systemCalculation?.items),
                ),
            )}
          />
        ) : null}
      </div>
      <span
        className={`finance-review-badge is-${item.reviewStatus.toLowerCase()}`}
      >
        {item.sourceType === 'SERVICE_TEMPLATE'
          ? t.badgeAuto
          : item.reviewStatus === 'PENDING'
            ? t.pending
            : isManagerPriced(item) &&
                item.managerApprovedAmount == null &&
                item.managerQuotedPrice == null
              ? t.badgeAwaitingPrice
              : t.badgeReviewed}
      </span>
      <button
        type="button"
        className="finance-chevron"
        aria-label={t.noteAria(item.content)}
        aria-expanded={openNote === item.id}
        onClick={() => setOpenNote(openNote === item.id ? null : item.id)}
      >
        <span aria-hidden="true">⌄</span>
      </button>
      {openNote === item.id ? (
        <label className="finance-note">
          <span>{t.managerNote}</span>
          <input
            defaultValue={item.managerNote ?? ''}
            disabled={accepted || item.reviewStatus === 'PENDING'}
            placeholder={
              item.reviewStatus === 'PENDING'
                ? t.notePlaceholderPending
                : t.notePlaceholderReason
            }
            onBlur={(event) =>
              void updateReview(item, item.reviewStatus, event.target.value)
            }
          />
        </label>
      ) : null}
    </div>
  )
}
