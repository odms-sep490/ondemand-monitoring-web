import { useState } from 'react'

import {
  pricingDescription,
  pricingLabel,
  pricingPolicyName,
} from '../../../../../shared/lib/pricingPresentation'
import { MediaPricingEditor } from './MediaPricingEditor'
import { CustomerAddedPricingForm } from './CustomerAddedPricingForm'
import { ISSUES, SharedMediaTiers } from './SharedMediaTiers'
import { isMediaRule, validateMediaRules } from '../../../lib/mediaPricingRules'
import type { PricingPolicy, PricingRule } from '../../../types/pricing'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { MoneyInput, UnitInput } from './PricingInputs'
import './pricingPolicyOverview.css'
import './pricingDraftEditor.css'

type Tab = 'common' | 'advanced'

/**
 * Edits a draft policy. What admins change most (limits, customer-added prices, the shared media price list) is on the
 * first page; the full rule list, grouped and folded, and per-profile media prices are on the second.
 */
export function PricingDraftEditor({
  draft,
  setDraft,
  busy,
  dirty,
  onSave,
  onPublish,
  onCancel,
}: {
  draft: PricingPolicy
  setDraft: (policy: PricingPolicy) => void
  busy: boolean
  /** Edits not yet saved on the server. */
  dirty: boolean
  onSave: () => void
  onPublish: () => void
  onCancel: () => void
}) {
  const [tab, setTab] = useState<Tab>('common')
  const [opened, setOpened] = useState<string[]>([])
  const [editingRule, setEditingRule] = useState<number | null>(null)
  const [newRule, setNewRule] = useState<PricingRule | null>(null)
  const problems = validateMediaRules(draft.rules)
  const mediaValid = problems.length === 0
  const guardrailsValid =
    draft.highRiskDiscountPercent <= draft.managerMaxDiscountPercent
  const canSubmit = mediaValid && guardrailsValid
  const rules = draft.rules
  const ordinary = rules.filter((rule) => !isMediaRule(rule))

  function updateRule(index: number, changes: Partial<PricingRule>) {
    setDraft({
      ...draft,
      rules: draft.rules.map((rule, i) =>
        i === index ? { ...rule, ...changes } : rule,
      ),
    })
  }
  function addRule() {
    setOpened((current) =>
      current.includes('AREA') ? current : [...current, 'AREA'],
    )
    setNewRule(blankRule(draft.rules.length))
  }
  function removeRule(index: number) {
    const rule = draft.rules[index]
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa quy tắc “${pricingDescription(rule.description)}”?`,
      )
    )
      return
    setDraft({
      ...draft,
      rules: draft.rules
        .filter((_, i) => i !== index)
        .map((rule, priority) => ({ ...rule, priority })),
    })
  }

  const renderRule = (rule: PricingRule, index: number) => (
    <article
      className={`pricing-rule-card${editingRule === index ? ' is-editing' : ''}`}
      key={`${rule.category}-${rule.ruleKey}`}
    >
      {editingRule === index ? (
        <PricingRuleEditor
          rule={rule}
          onChange={(changes) => updateRule(index, changes)}
          onDone={() => setEditingRule(null)}
        />
      ) : (
        <>
          <div className="pricing-rule-card-head">
            <div>
              <span className="pricing-rule-kind">
                {pricingLabel(rule.calculationType)}
              </span>
              <h4>{pricingDescription(rule.description)}</h4>
              <code>{rule.ruleKey}</code>
            </div>
            <span className={`pricing-rule-state${rule.enabled ? '' : ' is-off'}`}>
              {rule.enabled ? 'Đang áp dụng' : 'Đã tắt'}
            </span>
          </div>
          <dl className="pricing-rule-summary">
            {ruleRange(rule) && (
              <div>
                <dt>Khoảng áp dụng</dt>
                <dd>{ruleRange(rule)}</dd>
              </div>
            )}
            <div>
              <dt>Cách tính</dt>
              <dd>{rulePrice(rule)}</dd>
            </div>
            {isDimensionBlockRule(rule) && (
              <div>
                <dt>Làm tròn</dt>
                <dd>{roundingLabel(rule.roundingMode)}</dd>
              </div>
            )}
          </dl>
          <div className="pricing-card-actions">
            <button
              className="odm-btn odm-btn-sm"
              type="button"
              onClick={() => setEditingRule(index)}
            >
              Chỉnh sửa
            </button>
            <button
              className="pricing-icon-button is-danger"
              type="button"
              aria-label={`Xóa quy tắc ${pricingDescription(rule.description)}`}
              title="Xóa quy tắc"
              onClick={() => removeRule(index)}
            >
              ×
            </button>
          </div>
        </>
      )}
    </article>
  )

  const groups = categories
    .map((category) => ({
      category,
      items: rules
        .map((rule, index) => ({ rule, index }))
        .filter(
          (entry) =>
            !isMediaRule(entry.rule) && entry.rule.category === category,
        ),
    }))
    .filter((group) => group.items.length > 0)

  const actions = (
    <div className="ppd-actions">
      <button className="odm-btn" disabled={busy} onClick={onCancel}>
        {dirty ? 'Hủy thay đổi' : 'Đóng'}
      </button>
      <button
        className="odm-btn"
        disabled={busy || !canSubmit}
        onClick={onSave}
      >
        Lưu bản nháp
      </button>
      <button
        className="odm-btn odm-btn-p"
        disabled={busy || !canSubmit}
        onClick={onPublish}
      >
        Áp dụng
      </button>
    </div>
  )

  return (
    <div className="ppd">
      <div className="ppd-bar">
        <div>
          <span className="ppo-eyebrow is-draft">Bản nháp</span>
          <h3>Chính sách giá v{draft.version}</h3>
          <p>Thiết lập giá áp dụng cho yêu cầu và giới hạn điều chỉnh của Manager.</p>
          {dirty && <span className="pricing-dirty">Có thay đổi chưa lưu</span>}
        </div>
        {actions}
      </div>
      {!mediaValid && (
        <div role="alert" className="ppd-warning">
          <p>
            Có bậc giá ảnh/video chưa hợp lệ. Sửa các lỗi dưới đây trước khi lưu
            hoặc phát hành:
          </p>
          <ul>
            {problems.map((problem) => {
              const rule = draft.rules[problem.index]
              return (
                <li key={`${problem.index}-${problem.issue}`}>
                  <b>
                    {rule.pricingProfile ?? '?'} · {rule.mediaComponent ?? '?'}
                    {rule.checklistDefinitionName
                      ? ` · ${rule.checklistDefinitionName}`
                      : ''}{' '}
                    ({rule.minValue ?? 0}–{rule.maxValue ?? '∞'})
                  </b>
                  : {ISSUES[problem.issue] ?? problem.issue}
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={() => setTab('advanced')}
          >
            Mở Quy tắc nâng cao để sửa
          </button>
        </div>
      )}

      <div className="adm-tabs" role="tablist">
        {(
          [
            ['common', 'Cấu hình cơ bản'],
            ['advanced', `Quy tắc nâng cao (${ordinary.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`adm-tab${tab === key ? ' is-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'common' && (
        <div className="ppd-page" role="tabpanel">
          <label className="ppd-name">
            Tên chính sách
            <input
              value={pricingPolicyName(draft.name)}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>

          <section className="ppo-card" aria-label="Giới hạn điều chỉnh giá">
            <h3>Giới hạn điều chỉnh giá</h3>
            <p className="ppo-hint">
              Mức Manager được phép giảm hoặc tăng so với giá hệ thống.
            </p>
            <div className="pricing-policy-guardrails">
              <NumberField
                label="Giảm giá tối đa (%)"
                value={draft.managerMaxDiscountPercent}
                onChange={(v) => {
                  const percent = Math.min(100, Math.max(0, v))
                  // The lowest price a Manager may reach is the system price less this discount, so the ratio follows it.
                  setDraft({
                    ...draft,
                    managerMaxDiscountPercent: percent,
                    minimumPriceRatio:
                      Math.round((100 - percent) * 100) / 10000,
                  })
                }}
              />
              <NumberField
                label="Mức tăng giá tối đa (%)"
                value={draft.managerMaxMarkupPercent}
                onChange={(v) =>
                  setDraft({ ...draft, managerMaxMarkupPercent: v })
                }
              />
              <NumberField
                label="Ngưỡng rủi ro cao (%)"
                value={draft.highRiskDiscountPercent}
                onChange={(v) =>
                  setDraft({ ...draft, highRiskDiscountPercent: v })
                }
              />
              <NumberField
                label="Giá sàn (VND)"
                value={draft.minimumPrice}
                onChange={(v) => setDraft({ ...draft, minimumPrice: v })}
              />
            </div>
            <p className="ppo-hint">
              Giá sau điều chỉnh không được thấp hơn{' '}
              {Math.round(draft.minimumPriceRatio * 10000) / 100}% giá hệ thống
              (tính từ mức giảm tối đa) và không thấp hơn giá sàn tuyệt đối.
              Giảm từ ngưỡng rủi ro cao trở lên sẽ được gắn cờ.
            </p>
            {!guardrailsValid && (
              <p role="alert" className="ppd-issues">
                Ngưỡng rủi ro cao không được lớn hơn mức giảm giá tối đa.
              </p>
            )}
          </section>

          <CustomerAddedPricingForm
            rules={draft.rules}
            onChange={(next) => setDraft({ ...draft, rules: next })}
          />

          <section
            className="ppo-card"
            aria-label="Bảng giá ảnh và video dùng chung"
          >
            <h3>Bảng giá ảnh và video dùng chung</h3>
            <p className="ppo-hint">
              Giá ảnh/video vượt định mức, áp dụng cho mọi checklist kể cả yêu
              cầu bổ sung. Số lượng vượt = max(0, số yêu cầu − số đã bao gồm).
            </p>
            <SharedMediaTiers
              rules={draft.rules}
              onChange={(next) => setDraft({ ...draft, rules: next })}
            />
          </section>
        </div>
      )}

      {tab === 'advanced' && (
        <div className="ppd-page" role="tabpanel">
          <p className="ppo-hint">
            Dành cho người quản trị có kinh nghiệm. Cấu hình cơ bản đã đủ cho
            hầu hết nhu cầu vận hành.
          </p>
          <div className="adm-card-head">
            <h3>Quy tắc tính giá</h3>
            <button className="odm-btn" type="button" onClick={addRule}>
              + Thêm quy tắc
            </button>
          </div>
          {newRule && (
            <section className="pricing-new-rule" aria-label="Tạo quy tắc giá">
              <header>
                <div>
                  <span className="pricing-section-kicker">Quy tắc mới</span>
                  <h3>Tạo quy tắc giá</h3>
                </div>
              </header>
              <PricingRuleEditor
                rule={newRule}
                onChange={(changes) =>
                  setNewRule((current) =>
                    current ? { ...current, ...changes } : current,
                  )
                }
                onDone={() => {
                  setDraft({ ...draft, rules: [...draft.rules, newRule] })
                  setNewRule(null)
                }}
                onCancel={() => setNewRule(null)}
                create
              />
            </section>
          )}
          {groups.length === 0 && (
            <p className="ppo-empty">Chưa có quy tắc nào.</p>
          )}
          {groups.map((group) => (
            <details
              key={group.category}
              className="ppd-group"
              open={opened.includes(group.category)}
              onToggle={(event) => {
                const isOpen = (event.currentTarget as HTMLDetailsElement).open
                setOpened((current) =>
                  isOpen
                    ? current.includes(group.category)
                      ? current
                      : [...current, group.category]
                    : current.filter((key) => key !== group.category),
                )
              }}
            >
              <summary>
                <span className="pricing-group-heading">
                  <strong>{pricingLabel(group.category)}</strong>
                  <span className="ppd-count">
                    {group.items.length} quy tắc
                  </span>
                </span>
                <span className="pricing-group-preview">
                  {categorySummary(group.items.map((entry) => entry.rule))}
                </span>
              </summary>
              <div className="ppd-group-body pricing-rule-cards">
                {group.items.map((entry) =>
                  renderRule(entry.rule, entry.index),
                )}
              </div>
            </details>
          ))}
          <details className="ppd-group">
            <summary>
              Giá ảnh/video nâng cao (hồ sơ giá, giá riêng cho từng checklist)
            </summary>
            <div className="ppd-group-body">
              <MediaPricingEditor
                rules={draft.rules}
                draftId={draft.id}
                onChange={(next) => setDraft({ ...draft, rules: next })}
                showCustomerForm={false}
              />
            </div>
          </details>
        </div>
      )}
      <div className="ppd-foot">{actions}</div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function PricingRuleEditor({
  rule,
  onChange,
  onDone,
  onCancel,
  create = false,
}: {
  rule: PricingRule
  onChange: (changes: Partial<PricingRule>) => void
  onDone: () => void
  onCancel?: () => void
  create?: boolean
}) {
  const block = ['PER_BLOCK', 'TIERED_BLOCK'].includes(rule.calculationType)
  const fixed = ['FIXED', 'PER_UNIT', 'PER_BLOCK', 'TIERED_BLOCK'].includes(
    rule.calculationType,
  )
  const percentage = rule.calculationType === 'PERCENT_OF_BASE'
  const multiplier = ['MULTIPLIER', 'RESOURCE_BASED', 'ACTUAL_COST'].includes(
    rule.calculationType,
  )
  return (
    <div className="pricing-rule-editor">
      <fieldset>
        <legend>Thông tin chung</legend>
        <div className="pricing-field-grid">
          <label className="pricing-field">
            <span className="pricing-field-label">Nhóm giá</span>
            <select
              aria-label="Nhóm giá"
              value={rule.category}
              onChange={(event) =>
                onChange({
                  category: event.target.value as PricingRule['category'],
                  roundingMode: ['AREA', 'DISTANCE', 'ALTITUDE'].includes(
                    event.target.value,
                  )
                    ? (rule.roundingMode ?? 'CEILING')
                    : null,
                })
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {pricingLabel(category)}
                </option>
              ))}
            </select>
          </label>
          <label className="pricing-field">
            <span className="pricing-field-label">Cách tính</span>
            <select
              aria-label="Cách tính"
              value={rule.calculationType}
              onChange={(event) => {
                const calculationType = event.target
                  .value as PricingRule['calculationType']
                const nextBlock = ['PER_BLOCK', 'TIERED_BLOCK'].includes(
                  calculationType,
                )
                onChange({
                  calculationType,
                  unitSize: nextBlock ? (rule.unitSize ?? 1) : null,
                  roundingMode: nextBlock
                    ? (rule.roundingMode ?? 'CEILING')
                    : null,
                })
              }}
            >
              {calculationTypes.map((type) => (
                <option key={type} value={type}>
                  {pricingLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="pricing-field">
            <span className="pricing-field-label">Mã quy tắc</span>
            <input
              aria-label="Mã quy tắc"
              value={rule.ruleKey}
              onChange={(event) => onChange({ ruleKey: event.target.value })}
            />
          </label>
          <label className="pricing-field pricing-field-wide">
            <span className="pricing-field-label">Tên quy tắc</span>
            <input
              aria-label="Tên quy tắc"
              value={pricingDescription(rule.description)}
              onChange={(event) =>
                onChange({ description: event.target.value })
              }
            />
          </label>
        </div>
      </fieldset>

      {(block || rule.minValue != null || rule.maxValue != null) && (
        <fieldset>
          <legend>Khoảng áp dụng</legend>
          <div className="pricing-field-grid">
            <UnitInput
              label="Giá trị từ"
              suffix={dimensionUnit(rule.category)}
              value={rule.minValue}
              onChange={(value) => onChange({ minValue: value })}
            />
            <UnitInput
              label="Giá trị đến"
              suffix={dimensionUnit(rule.category)}
              value={rule.maxValue}
              onChange={(value) => onChange({ maxValue: value })}
              helper="Để trống nếu không có giới hạn trên."
            />
          </div>
        </fieldset>
      )}

      {rule.calculationType !== 'MANUAL_QUOTE' && (
        <fieldset>
          <legend>Cách tính giá</legend>
          <div className="pricing-field-grid">
            {block && (
              <UnitInput
                label="Kích thước khối"
                suffix={dimensionUnit(rule.category)}
                min={1}
                value={rule.unitSize}
                onChange={(value) => onChange({ unitSize: value })}
                helper="Số lượng được tính thành một đơn vị giá."
              />
            )}
            {fixed && (
              <MoneyInput
                label={block ? 'Giá mỗi khối' : 'Giá cố định'}
                value={rule.fixedAmount}
                onChange={(value) => onChange({ fixedAmount: value })}
              />
            )}
            {percentage && (
              <UnitInput
                label="Tỷ lệ phần trăm"
                suffix="%"
                value={rule.percentage}
                onChange={(value) => onChange({ percentage: value })}
              />
            )}
            {multiplier && (
              <UnitInput
                label="Hệ số"
                suffix="lần"
                step={0.01}
                value={rule.multiplier}
                onChange={(value) => onChange({ multiplier: value })}
              />
            )}
            {block && isDimensionBlockRule(rule) && (
              <label className="pricing-field">
                <span className="pricing-field-label">Làm tròn</span>
                <select
                  aria-label="Làm tròn"
                  value={rule.roundingMode ?? 'CEILING'}
                  onChange={(event) =>
                    onChange({
                      roundingMode: event.target
                        .value as PricingRule['roundingMode'],
                    })
                  }
                >
                  <option value="CEILING">Làm tròn lên</option>
                  <option value="FLOOR">Làm tròn xuống</option>
                  <option value="HALF_UP">Làm tròn gần nhất</option>
                </select>
              </label>
            )}
          </div>
        </fieldset>
      )}

      <div className="pricing-rule-editor-footer">
        <label className="pricing-switch">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={(event) => onChange({ enabled: event.target.checked })}
          />
          <span aria-hidden="true" />
          Đang áp dụng
        </label>
        <div className="pricing-card-actions">
          {onCancel && (
            <button type="button" className="odm-btn" onClick={onCancel}>
              Hủy
            </button>
          )}
          <button type="button" className="odm-btn odm-btn-p" onClick={onDone}>
            {create ? 'Thêm quy tắc' : 'Xong'}
          </button>
        </div>
      </div>
    </div>
  )
}

function blankRule(priority: number): PricingRule {
  return {
    category: 'AREA',
    calculationType: 'PER_BLOCK',
    ruleKey: `NEW_RULE_${priority + 1}`,
    description: 'Quy tắc mới',
    minValue: 0,
    maxValue: null,
    fixedAmount: 0,
    baseAmount: null,
    percentage: null,
    unitSize: 1,
    multiplier: null,
    priority,
    enabled: true,
    roundingMode: 'CEILING',
  }
}

function ruleRange(rule: PricingRule) {
  if (rule.minValue == null && rule.maxValue == null) return ''
  const unit = dimensionUnit(rule.category)
  if (rule.maxValue == null) return `Từ ${rule.minValue ?? 0} ${unit} trở lên`
  return `${rule.minValue ?? 0}–${rule.maxValue} ${unit}`
}

function rulePrice(rule: PricingRule) {
  if (['PER_BLOCK', 'TIERED_BLOCK'].includes(rule.calculationType))
    return `${formatVnd(rule.fixedAmount ?? 0)} / mỗi ${rule.unitSize ?? 1} ${dimensionUnit(rule.category)}`
  if (rule.calculationType === 'PERCENT_OF_BASE')
    return `${rule.percentage ?? 0}% giá cơ sở`
  if (rule.calculationType === 'MULTIPLIER')
    return `Hệ số ${rule.multiplier ?? 0}`
  if (rule.calculationType === 'MANUAL_QUOTE') return 'Báo giá thủ công'
  return formatVnd(rule.fixedAmount ?? rule.baseAmount ?? 0)
}

function categorySummary(rules: PricingRule[]) {
  const preview = rules.slice(0, 2).map((rule) => {
    const range = ruleRange(rule)
    return `${range ? `${range}: ` : ''}${rulePrice(rule)}`
  })
  const remaining = rules.length - preview.length
  return `${preview.join(' · ')}${remaining > 0 ? ` · và ${remaining} quy tắc khác` : ''}`
}

function dimensionUnit(category: PricingRule['category']) {
  if (category === 'AREA') return 'ha'
  if (category === 'DISTANCE') return 'km'
  if (category === 'ALTITUDE') return 'm'
  return 'đơn vị'
}

function roundingLabel(rounding: PricingRule['roundingMode']) {
  if (rounding === 'FLOOR') return 'Làm tròn xuống'
  if (rounding === 'HALF_UP') return 'Làm tròn gần nhất'
  return 'Làm tròn lên'
}

const categories: PricingRule['category'][] = [
  'PACKAGE',
  'DISTANCE',
  'AREA',
  'ALTITUDE',
  'CHECKLIST',
  'OUTPUT',
  'RESOURCE',
  'TERRAIN',
  'CONDITION',
  'PERMIT',
  'DISCOUNT',
  'MANAGER_ADJUSTMENT',
]

const calculationTypes: PricingRule['calculationType'][] = [
  'FIXED',
  'PERCENT_OF_BASE',
  'PER_UNIT',
  'PER_BLOCK',
  'TIERED_BLOCK',
  'MULTIPLIER',
  'RESOURCE_BASED',
  'ACTUAL_COST',
  'MANUAL_QUOTE',
]

function isDimensionBlockRule(rule: PricingRule) {
  return (
    ['AREA', 'DISTANCE', 'ALTITUDE'].includes(rule.category) &&
    ['PER_BLOCK', 'TIERED_BLOCK'].includes(rule.calculationType)
  )
}
