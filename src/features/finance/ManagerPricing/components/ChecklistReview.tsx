import { pricingLabel } from '../../../../shared/lib/pricingPresentation'
import type { ChecklistReviewStatus } from '../../types'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import type { PricingChecklistItem, PricingReview } from '../../types'
import type { Draft } from '../pricingHelpers'
import { ChecklistRow } from './ChecklistRow'

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
    { readonly key: 'all'; readonly label: 'Tất cả'; readonly count: number },
    {
      readonly key: 'pending'
      readonly label: 'Chưa xem xét'
      readonly count: number
    },
    {
      readonly key: 'reviewed'
      readonly label: 'Đã xem xét'
      readonly count: number
    },
    {
      readonly key: 'additional'
      readonly label: 'Có phụ phí'
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
  return (
    <section
      className="odm-or-card finance-panel"
      aria-labelledby="manager-pricing-title"
    >
      <header className="finance-heading">
        <div>
          <h2 id="manager-pricing-title">Xem xét yêu cầu và báo giá</h2>
          <p>Mỗi yêu cầu phải được phân loại trước khi duyệt báo giá.</p>
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
          <strong>
            {reviewedCount}/{checklistCount} nội dung đã xem xét
          </strong>
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
        <div className="finance-filters" role="group" aria-label="Lọc nội dung">
          {filterLabels.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`finance-filter${filter === item.key ? ' is-on' : ''}`}
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
      </div>
      <div
        className={`finance-review-warning ${reviewComplete ? 'is-complete' : 'is-pending'}`}
        role="status"
      >
        <span aria-hidden="true" className="finance-review-warning-icon">
          {reviewComplete ? '✓' : '!'}
        </span>
        {reviewComplete
          ? 'Checklist đã hoàn tất và có thể duyệt báo giá.'
          : `Còn ${pendingReviewCount} nội dung cần chọn cách tính giá trước khi duyệt.`}
      </div>
      <div className="finance-checklist">
        <div className="finance-table-head" aria-hidden="true">
          <span>#</span>
          <span>Nội dung yêu cầu</span>
          <span>Cách tính giá</span>
          <span>Phụ phí</span>
          <span>Trạng thái</span>
          <span>Ghi chú</span>
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
