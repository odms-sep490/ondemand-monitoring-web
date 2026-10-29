import { Button } from 'antd'
import { CheckOutlined, ExclamationOutlined } from '@ant-design/icons'
import { pricingLabel } from '../../../../shared/lib/pricingPresentation'
import type { ChecklistReviewStatus } from '../../types'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import type { PricingChecklistItem, PricingReview } from '../../types'
import type { Draft } from '../pricingHelpers'
import { ChecklistRow } from './ChecklistRow'
import { useI18n } from '../../../../shared/i18n'
import { pricingMessages } from '../pricing.messages'

export function ChecklistReview({
  reviewComplete,
  reviewedCount,
  checklistCount,
  filterLabels,
  filter,
  setFilter,
  pendingReviewCount,
  visibleItems,
  accepted,
  updateReview,
  draft,
  setDraft,
  dirtyPriceIds,
  priceRange,
  openNote,
  setOpenNote,
  data,
}: {
  reviewComplete: boolean
  reviewedCount: number
  checklistCount: number
  filterLabels: readonly [
    { readonly key: 'all'; readonly label: string; readonly count: number },
    { readonly key: 'pending'; readonly label: string; readonly count: number },
    {
      readonly key: 'reviewed'
      readonly label: string
      readonly count: number
    },
    {
      readonly key: 'additional'
      readonly label: string
      readonly count: number
    },
  ]
  filter: 'all' | 'pending' | 'reviewed' | 'additional'
  setFilter: Dispatch<
    SetStateAction<'all' | 'pending' | 'reviewed' | 'additional'>
  >
  pendingReviewCount: number
  visibleItems: PricingChecklistItem[]
  accepted: boolean
  updateReview: (
    item: PricingChecklistItem,
    status: ChecklistReviewStatus,
    managerNote?: string,
  ) => Promise<void>
  draft: Draft
  setDraft: Dispatch<SetStateAction<Draft>>
  dirtyPriceIds: RefObject<Set<string>>
  priceRange: (system: number) => { min: number; max: number } | null
  openNote: string | null
  setOpenNote: Dispatch<SetStateAction<string | null>>
  data: PricingReview
}) {
  const { t } = useI18n(pricingMessages)
  return (
    <section
      className="mgr-card finance-panel"
      aria-labelledby="manager-pricing-title"
    >
      <header className="finance-heading">
        <div>
          <h2 id="manager-pricing-title">{t.reviewTitle}</h2>
          <p>{t.reviewSubtitle}</p>
        </div>
        {data.currentQuote ? (
          <span
            className={`finance-status is-${data.currentQuote.status.toLowerCase()}`}
          >
            v{data.currentQuote.version} ·{' '}
            {pricingLabel(data.currentQuote.status)}
          </span>
        ) : null}
      </header>
      <div className="finance-toolbar">
        <div
          className={`finance-review-progress ${reviewComplete ? 'is-complete' : 'is-pending'}`}
          role="status"
        >
          <strong>{t.reviewedProgress(reviewedCount, checklistCount)}</strong>
          <span className="finance-progress-percent">
            (
            {checklistCount
              ? Math.round((reviewedCount / checklistCount) * 100)
              : 0}
            %)
          </span>
          <span className="finance-progress-track">
            <span
              style={{
                width: `${checklistCount ? (reviewedCount / checklistCount) * 100 : 0}%`,
              }}
            />
          </span>
        </div>
        <div
          className="finance-filters"
          role="group"
          aria-label={t.filterGroupAria}
        >
          {filterLabels.map((item) => (
            <Button
              key={item.key}
              size="small"
              type={filter === item.key ? 'primary' : 'default'}
              className={`finance-filter${filter === item.key ? ' is-on' : ''}`}
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
            >
              {item.label} ({item.count})
            </Button>
          ))}
        </div>
      </div>
      <div
        className={`finance-review-warning ${reviewComplete ? 'is-complete' : 'is-pending'}`}
        role="status"
      >
        <span aria-hidden="true" className="finance-review-warning-icon">
          {reviewComplete ? <CheckOutlined /> : <ExclamationOutlined />}
        </span>
        {reviewComplete
          ? t.checklistComplete
          : t.checklistRemaining(pendingReviewCount)}
      </div>
      <div className="finance-checklist">
        <div className="finance-table-head" aria-hidden="true">
          <span>#</span>
          <span>{t.colContent}</span>
          <span>{t.colPricing}</span>
          <span>{t.colSurcharge}</span>
          <span>{t.colStatus}</span>
          <span>{t.colNote}</span>
        </div>
        {visibleItems.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            data={data}
            accepted={accepted}
            updateReview={updateReview}
            draft={draft}
            setDraft={setDraft}
            dirtyPriceIds={dirtyPriceIds}
            priceRange={priceRange}
            openNote={openNote}
            setOpenNote={setOpenNote}
          />
        ))}
      </div>
    </section>
  )
}
