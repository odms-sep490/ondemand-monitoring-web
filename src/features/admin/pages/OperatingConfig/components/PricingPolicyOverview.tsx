import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import {
  pricingLabel,
  pricingPolicyName,
} from '../../../../../shared/lib/pricingPresentation'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { migrateLegacyCustomerAdded } from '../../../lib/mediaPricingRules'
import type { PricingPolicy, PricingRule } from '../../../types/pricing'
import './pricingPolicyOverview.css'

const CUSTOM = 'GENERIC_CUSTOMER_ADDED'

const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '—'

const customRule = (rules: PricingRule[], component: string) =>
  rules.find(
    (rule) =>
      rule.category === 'MEDIA' &&
      rule.enabled &&
      (rule.pricingProfile ?? '').toUpperCase() === CUSTOM &&
      rule.mediaComponent === component,
  )

const number = (value: number | null | undefined, suffix = '') =>
  value == null ? '—' : `${value.toLocaleString('vi-VN')}${suffix}`

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="ppo-tile">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/** One line of a tier list: "Ảnh · 0–10 ảnh · 50.000 ₫ mỗi 10 ảnh". */
function tierLine(rule: PricingRule, noun: string) {
  const from = rule.minValue ?? 0
  const range =
    rule.maxValue == null ? `từ ${from}` : `${from}–${rule.maxValue}`
  const block =
    rule.unitSize && rule.unitSize > 1
      ? ` mỗi ${rule.unitSize} ${noun}`
      : ` mỗi ${noun}`
  return `${range} ${noun}: ${formatVnd(rule.fixedAmount ?? 0)}${block}`
}

/**
 * Read-only view of the policy in force: what it is, the limits it sets and the prices admins ask about most.
 * Editing happens in a draft copy, so the way to change anything is the single "copy to draft" action here.
 */
export function PricingPolicyOverview({
  active,
  draft = null,
  policies,
  busy,
  onClone,
  onEditDraft,
}: {
  active: PricingPolicy | undefined
  /** A draft that exists on the server but is not being edited right now. */
  draft?: PricingPolicy | null
  policies: PricingPolicy[]
  busy: boolean
  onClone: () => void
  onEditDraft?: () => void
}) {
  // Policies from before the GENERIC_CUSTOMER_ADDED profile keep these prices under CUSTOM; show what the engine uses.
  const customerRules = migrateLegacyCustomerAdded(active?.rules ?? [])
  const imageTiers = (active?.rules ?? [])
    .filter(
      (rule) =>
        rule.category === 'MEDIA' &&
        rule.enabled &&
        rule.mediaComponent === 'EXTRA_IMAGE' &&
        (rule.pricingProfile ?? '').toUpperCase() === 'DEFAULT',
    )
    .sort((a, b) => (a.minValue ?? 0) - (b.minValue ?? 0))
  const videoTiers = (active?.rules ?? [])
    .filter(
      (rule) =>
        rule.category === 'MEDIA' &&
        rule.enabled &&
        rule.mediaComponent === 'EXTRA_VIDEO' &&
        (rule.pricingProfile ?? '').toUpperCase() === 'DEFAULT',
    )
    .sort((a, b) => (a.minValue ?? 0) - (b.minValue ?? 0))
  const sorted = [...policies].sort((a, b) => b.version - a.version)

  return (
    <div className="ppo">
      <header className="ppo-head">
        <h2>Chính sách giá mặc định</h2>
        <p>
          Chính sách giá được sử dụng để tính giá cho các yêu cầu vận hành.
          Mỗi lần áp dụng sẽ tạo một phiên bản mới; chính sách đã áp dụng không
          thể chỉnh sửa.
        </p>
      </header>

      {draft && (
        <section className="ppo-card" aria-label="Bản nháp đang chỉnh sửa">
          <p className="ppo-note">
            Đang có bản nháp phiên bản {draft.version} chưa phát hành.{' '}
            {onEditDraft && (
              <button
                type="button"
                className="odm-btn odm-btn-sm"
                onClick={onEditDraft}
              >
                Tiếp tục chỉnh sửa bản nháp
              </button>
            )}
          </p>
        </section>
      )}

      {active ? (
        <>
          <section
            className="ppo-card ppo-active"
            aria-label="Chính sách đang áp dụng"
          >
            <div className="ppo-active-head">
              <div>
                <span className="ppo-eyebrow">Đang áp dụng</span>
                <h3>
                  Chính sách giá v{active.version} ·{' '}
                  {pricingPolicyName(active.name)}
                </h3>
                <small>
                  Có hiệu lực từ {date(active.effectiveFrom)} ·{' '}
                  {active.rules.length} quy tắc
                </small>
              </div>
              <button
                className="odm-btn odm-btn-p"
                disabled={busy || draft !== null}
                onClick={onClone}
              >
                Tạo bản nháp mới
              </button>
            </div>
            <p role="note" className="ppo-note">
              Chính sách giá đang áp dụng không thể chỉnh sửa trực tiếp. Hãy
              tạo bản nháp mới để thay đổi và áp dụng.
            </p>
            <dl className="ppo-tiles">
              <Tile
                label="Giảm giá tối đa"
                value={number(active.managerMaxDiscountPercent, '%')}
              />
              <Tile
                label="Mức tăng giá tối đa"
                value={number(active.managerMaxMarkupPercent, '%')}
              />
              <Tile
                label="Ngưỡng rủi ro cao"
                value={number(active.highRiskDiscountPercent, '%')}
              />
              <Tile
                label="Tỷ lệ giá sàn"
                value={number(active.minimumPriceRatio)}
              />
              <Tile label="Giá sàn" value={formatVnd(active.minimumPrice)} />
            </dl>
          </section>

          <section className="ppo-card" aria-label="Giá yêu cầu bổ sung">
            <h3>Giá yêu cầu bổ sung</h3>
            <p className="ppo-hint">
              Giá = giá nền + diện tích vượt định mức + ảnh vượt + video vượt.
            </p>
            <dl className="ppo-tiles">
              <Tile
                label="Giá nền"
                value={formatVnd(
                  customRule(customerRules, 'CHECKLIST_BASE')?.fixedAmount ?? 0,
                )}
              />
              <Tile
                label="Ảnh đã bao gồm"
                value={number(
                  customRule(customerRules, 'INCLUDED_IMAGE')
                    ?.includedQuantity ?? 0,
                )}
              />
              <Tile
                label="Video đã bao gồm"
                value={number(
                  customRule(customerRules, 'INCLUDED_VIDEO')
                    ?.includedQuantity ?? 0,
                )}
              />
              <Tile
                label="Diện tích đã bao gồm"
                value={number(
                  customRule(customerRules, 'INCLUDED_AREA')
                    ?.includedQuantity ?? 0,
                  ' ha',
                )}
              />
              <Tile
                label="Phụ thu mỗi ha vượt"
                value={
                  customRule(customerRules, 'EXTRA_AREA')
                    ? formatVnd(
                        customRule(customerRules, 'EXTRA_AREA')?.fixedAmount ??
                          0,
                      )
                    : 'Chưa cấu hình'
                }
              />
            </dl>
          </section>

          <section
            className="ppo-card"
            aria-label="Bảng giá ảnh và video dùng chung"
          >
            <h3>Bảng giá ảnh và video dùng chung</h3>
            <p className="ppo-hint">
              Ảnh/video vượt định mức, áp dụng cho mọi checklist kể cả yêu cầu
              bổ sung.
            </p>
            <div className="ppo-columns">
              <div>
                <strong>Ảnh vượt định mức</strong>
                {imageTiers.length === 0 ? (
                  <p className="ppo-empty">Chưa cấu hình</p>
                ) : (
                  <ul>
                    {imageTiers.map((rule) => (
                      <li key={rule.ruleKey}>{tierLine(rule, 'ảnh')}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <strong>Video vượt định mức</strong>
                {videoTiers.length === 0 ? (
                  <p className="ppo-empty">Chưa cấu hình</p>
                ) : (
                  <ul>
                    {videoTiers.map((rule) => (
                      <li key={rule.ruleKey}>{tierLine(rule, 'video')}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="ppo-card ppo-empty-card" role="note">
          <h3>Chưa có chính sách giá đang áp dụng</h3>
          <p className="ppo-hint">
            Hệ thống chưa có phiên bản nào được phát hành. Không có chính sách
            đang áp dụng thì chưa thể nhân bản để chỉnh sửa.
          </p>
        </section>
      )}

      <section className="ppo-card" aria-label="Các phiên bản">
        <h3>Các phiên bản</h3>
        {sorted.length === 0 ? (
          <p className="ppo-empty">Chưa có chính sách giá.</p>
        ) : (
          <ul className="ppo-versions">
            {sorted.map((policy) => (
            <li key={policy.id}>
              <span>
                <b>
                  Chính sách giá v{policy.version} ·{' '}
                  {pricingPolicyName(policy.name)}
                </b>
                <small>
                  {policy.effectiveFrom
                    ? `từ ${date(policy.effectiveFrom)}`
                    : 'chưa phát hành'}
                  {policy.effectiveTo ? ` đến ${date(policy.effectiveTo)}` : ''}
                </small>
              </span>
              <StatusBadge
                tone={toUiTone(
                  policy.status === 'ACTIVE'
                    ? 'green'
                    : policy.status === 'DRAFT'
                      ? 'yellow'
                      : 'gray',
                )}
              >
                {pricingLabel(policy.status)}
              </StatusBadge>
            </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
