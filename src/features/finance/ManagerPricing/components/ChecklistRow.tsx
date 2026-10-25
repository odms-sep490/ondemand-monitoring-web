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

export function ChecklistRow({
  item,
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
  return (
    <div
      className={`finance-requirement is-${item.reviewStatus.toLowerCase()}`}
    >
      <span className="finance-index">
        {String(data!.checklistItems.indexOf(item) + 1).padStart(2, '0')}
      </span>
      <div className="finance-requirement-main">
        <strong>{item.content}</strong>
        <span>
          {item.sourceType === 'SERVICE_TEMPLATE'
            ? 'Yêu cầu mặc định của gói'
            : 'Yêu cầu thêm của khách hàng'}
        </span>
        {(item.requestedImageCount ?? 0) + (item.requestedVideoCount ?? 0) >
        0 ? (
          <span>
            Khách yêu cầu: {item.requestedImageCount ?? 0} ảnh ·{' '}
            {item.requestedVideoCount ?? 0} video
          </span>
        ) : null}
      </div>
      {item.sourceType === 'SERVICE_TEMPLATE' ? (
        <div className="finance-zero">Đã gồm trong gói</div>
      ) : (
        <label className="finance-status-select">
          <span className="finance-sr">Phân loại</span>
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
              Chưa xem xét
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
          Giá hệ thống:{' '}
          {formatVnd(liveSystemPrice(item, data?.systemCalculation?.items))}
        </small>
        {isManagerPriced(item) ? (
          <MoneyInput
            label="Giá duyệt"
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
          ? 'Tự động tính giá'
          : item.reviewStatus === 'PENDING'
            ? 'Chưa xem xét'
            : isManagerPriced(item) &&
                item.managerApprovedAmount == null &&
                item.managerQuotedPrice == null
              ? 'Chờ duyệt giá'
              : 'Đã xem xét'}
      </span>
      <button
        type="button"
        className="finance-chevron"
        aria-label={`Ghi chú: ${item.content}`}
        aria-expanded={openNote === item.id}
        onClick={() => setOpenNote(openNote === item.id ? null : item.id)}
      >
        <span aria-hidden="true">⌄</span>
      </button>
      {openNote === item.id ? (
        <label className="finance-note">
          <span>Ghi chú của quản lý</span>
          <input
            defaultValue={item.managerNote ?? ''}
            disabled={accepted || item.reviewStatus === 'PENDING'}
            placeholder={
              item.reviewStatus === 'PENDING'
                ? 'Phân loại nội dung trước'
                : 'Lý do hoặc phạm vi xử lý'
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
