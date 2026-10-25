import { QuoteBreakdown } from './QuoteBreakdown'
import { SummaryRow } from './SummaryRow'
import { MIN_REASON_LENGTH } from '../pricingHelpers'
import type { Draft } from '../pricingHelpers'
import type { Dispatch, SetStateAction } from 'react'
import type { PricingReview } from '../../types'

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
  approveBlockedReason: string | null | undefined
  approve: () => Promise<void>
  data: PricingReview
}) {
  return (
    <aside className="odm-or-card finance-quote" aria-label="Tóm tắt báo giá">
      <header className="finance-heading finance-quote-heading">
        <h2>Tóm tắt báo giá</h2>
        <span className="finance-policy-pill">
          Chính sách giá v
          {data.systemCalculation?.policyVersion ??
            data.currentQuote?.pricingPolicyVersion ??
            '—'}
        </span>
      </header>
      <div className="finance-quote-body">
        <div className="finance-quote-content">
          <QuoteBreakdown
            items={data.systemCalculation?.items ?? []}
            checklistItems={data.checklistItems}
          />
          <dl className="finance-summary">
            <SummaryRow label="Giá hệ thống" value={systemPrice} />
            <SummaryRow
              label="Điều chỉnh"
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
            <SummaryRow label="Tổng báo giá" value={total} total />
          </dl>
          {!reviewComplete && (
            <p className="finance-block-hint">
              Còn {pendingReviewCount} nội dung cần xem xét trước khi duyệt.
            </p>
          )}
          {checklistAdjustment !== 0 || draft.adjustmentReason ? (
            <label className="finance-quote-note">
              <span>
                Lý do điều chỉnh giá{' '}
                <em>(bắt buộc, ít nhất {MIN_REASON_LENGTH} ký tự)</em>
              </span>
              <textarea
                rows={3}
                value={draft.adjustmentReason}
                disabled={accepted}
                aria-invalid={
                  checklistAdjustment !== 0 &&
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
                {draft.adjustmentReason.trim().length}/{MIN_REASON_LENGTH} ký tự
                tối thiểu
              </small>
            </label>
          ) : null}
          <label className="finance-quote-note">
            <span>Ghi chú báo giá (tùy chọn)</span>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Thêm ghi chú cho báo giá..."
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
              <button
                id="manager-approve-quote"
                className="odm-btn odm-btn-p"
                type="button"
                disabled={
                  busy ||
                  approved ||
                  pendingCustomCount > 0 ||
                  outOfRangeCount > 0 ||
                  Boolean(approveBlockedReason)
                }
                title={
                  pendingCustomCount > 0
                    ? 'Phân loại các yêu cầu bổ sung trước khi duyệt báo giá'
                    : outOfRangeCount > 0
                      ? 'Có giá duyệt ngoài khoảng cho phép'
                      : (approveBlockedReason ?? undefined)
                }
                onClick={() => void approve()}
              >
                {approved ? 'Đã duyệt thành công' : 'Duyệt báo giá'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
