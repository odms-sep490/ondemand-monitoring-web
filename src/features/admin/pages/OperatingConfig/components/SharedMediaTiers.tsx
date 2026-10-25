import { useState } from 'react'

import {
  newMediaRule,
  validateMediaRules,
} from '../../../lib/mediaPricingRules'
import type { MediaPricingComponent, PricingRule } from '../../../types/pricing'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { MoneyInput, UnitInput } from './PricingInputs'

type Kind = {
  component: Extract<MediaPricingComponent, 'EXTRA_IMAGE' | 'EXTRA_VIDEO'>
  title: string
  noun: string
}

const KINDS: Kind[] = [
  { component: 'EXTRA_IMAGE', title: 'Ảnh vượt định mức', noun: 'ảnh' },
  { component: 'EXTRA_VIDEO', title: 'Video vượt định mức', noun: 'video' },
]

const SHARED_PROFILE = 'DEFAULT'

const isShared = (rule: PricingRule, component: MediaPricingComponent) =>
  rule.category === 'MEDIA' &&
  (rule.pricingProfile ?? '').toUpperCase() === SHARED_PROFILE &&
  !rule.checklistDefinitionId &&
  rule.mediaComponent === component

export const ISSUES: Record<string, string> = {
  PROFILE: 'Hồ sơ giá chỉ gồm chữ, số, gạch dưới.',
  COMPONENT: 'Thiếu thành phần giá.',
  ALLOWANCE:
    'Định mức đã bao gồm không hợp lệ (số nguyên 0–500, chỉ cho yêu cầu bổ sung).',
  PRICE: 'Nhập giá là số nguyên.',
  NEGATIVE: 'Không được âm.',
  BLOCK_SIZE: 'Kích thước khối phải là số nguyên từ 1.',
  RANGE: '"Đến" phải lớn hơn "Từ".',
  OVERLAP: 'Các bậc chồng lên nhau.',
  GAP: 'Các bậc phải liền nhau, bắt đầu từ 0.',
  OPEN_ENDED: 'Chỉ bậc cuối được để trống "Đến".',
}

/**
 * The price list for images and videos above the allowance, shared by every checklist and by customer-added work.
 * Only this one list is shown here; per-profile and per-checklist lists live in the advanced tab.
 */
export function SharedMediaTiers({
  rules,
  onChange,
}: {
  rules: PricingRule[]
  onChange: (rules: PricingRule[]) => void
}) {
  const [editing, setEditing] = useState<number | null>(null)
  const problems = validateMediaRules(rules)
  const patch = (index: number, changes: Partial<PricingRule>) =>
    onChange(
      rules.map((rule, i) => (i === index ? { ...rule, ...changes } : rule)),
    )
  return (
    <div className="ppd-media">
      {KINDS.map((kind) => {
        const rows = rules
          .map((rule, index) => ({ rule, index }))
          .filter((entry) => isShared(entry.rule, kind.component))
          .sort((a, b) => (a.rule.minValue ?? 0) - (b.rule.minValue ?? 0))
        return (
          <section
            key={kind.component}
            className="ppd-tier-group"
            aria-label={kind.title}
          >
            <header className="pricing-tier-head">
              <div>
                <h4>{kind.title}</h4>
                <p>
                  Áp dụng khi số {kind.noun} khách yêu cầu vượt định mức đã bao
                  gồm.
                </p>
              </div>
              <span className="ppd-count">{rows.length} bậc giá</span>
            </header>
            {rows.length === 0 && (
              <p className="ppo-empty">
                Chưa có bậc giá. Ảnh/video vượt định mức sẽ không tính được cho
                đến khi thêm.
              </p>
            )}
            {rows.map(({ rule, index }) => {
              const own = problems.filter((p) => p.index === index)
              return (
                <article
                  className={`ppd-tier${editing === index ? ' is-editing' : ''}`}
                  key={rule.ruleKey}
                  data-testid="shared-tier"
                >
                  {editing === index ? (
                    <div className="pricing-tier-editor">
                      <div className="pricing-field-grid pricing-field-grid-four">
                        <UnitInput
                          label="Giá trị từ"
                          ariaLabel={`${kind.title}: từ`}
                          suffix={kind.noun}
                          min={0}
                          value={rule.minValue ?? 0}
                          onChange={(value) =>
                            patch(index, { minValue: value ?? 0 })
                          }
                          helper="Mốc kỹ thuật bắt đầu từ 0 cho phần vượt định mức."
                        />
                        <UnitInput
                          label="Giá trị đến"
                          ariaLabel={`${kind.title}: đến`}
                          suffix={kind.noun}
                          min={1}
                          value={rule.maxValue ?? null}
                          onChange={(value) => patch(index, { maxValue: value })}
                          helper="Để trống nếu đây là bậc cuối không giới hạn."
                        />
                        <UnitInput
                          label="Kích thước khối"
                          ariaLabel={`${kind.title}: kích thước khối`}
                          suffix={kind.noun}
                          min={1}
                          value={rule.unitSize ?? null}
                          onChange={(value) => patch(index, { unitSize: value })}
                          helper="Số lượng được tính thành một đơn vị giá."
                        />
                        <MoneyInput
                          label="Giá mỗi khối"
                          ariaLabel={`${kind.title}: giá mỗi khối`}
                          value={rule.fixedAmount ?? null}
                          onChange={(value) =>
                            patch(index, { fixedAmount: value })
                          }
                        />
                      </div>
                      <div className="pricing-card-actions">
                        <button
                          type="button"
                          className="odm-btn odm-btn-sm"
                          onClick={() => setEditing(null)}
                        >
                          Xong
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="pricing-tier-summary">
                        <strong>{tierRange(rule, kind)}</strong>
                        <span>
                          {formatVnd(rule.fixedAmount ?? 0)} / mỗi{' '}
                          {rule.unitSize ?? 1} {kind.noun}
                        </span>
                        <small>{roundingLabel(rule.roundingMode)}</small>
                      </div>
                      <div className="pricing-card-actions">
                        <button
                          type="button"
                          className="odm-btn odm-btn-sm"
                          onClick={() => setEditing(index)}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          className="pricing-icon-button is-danger"
                          aria-label={`Xóa bậc ${kind.noun} ${tierRange(rule, kind)}`}
                          title="Xóa bậc giá"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Bạn có chắc muốn xóa bậc giá “${tierRange(rule, kind)}”?`,
                              )
                            )
                              onChange(rules.filter((_, i) => i !== index))
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                  {own.length > 0 && (
                    <ul role="alert" className="ppd-issues">
                      {own.map((p) => (
                        <li key={p.issue}>{ISSUES[p.issue] ?? p.issue}</li>
                      ))}
                    </ul>
                  )}
                </article>
              )
            })}
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={() => {
                const next = [
                  ...rules,
                  newMediaRule(SHARED_PROFILE, kind.component, rules),
                ]
                onChange(next)
                setEditing(next.length - 1)
              }}
            >
              + Thêm bậc giá
            </button>
          </section>
        )
      })}
    </div>
  )
}

function tierRange(rule: PricingRule, kind: Kind) {
  const from = (rule.minValue ?? 0) + 1
  const to = rule.maxValue
  if (kind.component === 'EXTRA_VIDEO' && from === 1 && to === 1)
    return 'Video đầu tiên'
  if (to == null)
    return `${kind.component === 'EXTRA_VIDEO' ? 'Video' : 'Ảnh'} từ ${from} trở lên`
  return `${kind.component === 'EXTRA_VIDEO' ? 'Video' : 'Ảnh'} ${from}–${to}`
}

function roundingLabel(rounding: PricingRule['roundingMode']) {
  if (rounding === 'FLOOR') return 'Làm tròn xuống'
  if (rounding === 'HALF_UP') return 'Làm tròn gần nhất'
  return 'Làm tròn lên'
}
