import { Alert, Button, Input, Select, Switch, Tabs, Tag } from 'antd'
import { useState } from 'react'

import { CardComponent, mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import {
  pricingDescription,
  pricingLabel,
  pricingPolicyName,
} from '../../../../../shared/lib/pricingPresentation'
import { MediaPricingEditor } from './MediaPricingEditor'
import { CustomerAddedPricingForm } from './CustomerAddedPricingForm'
import { SharedMediaTiers } from './SharedMediaTiers'
import { isMediaRule, validateMediaRules } from '../../../lib/mediaPricingRules'
import type { PricingPolicy, PricingRule } from '../../../types/pricing'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { MoneyInput, UnitInput } from './PricingInputs'
import { pricingConfigMessages } from './pricingConfig.messages'
import './pricingPolicyOverview.css'
import './pricingDraftEditor.css'

type Tab = 'common' | 'advanced'
type Messages = (typeof pricingConfigMessages)['vi']

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
  const { t } = useI18n(pricingConfigMessages)
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
    setNewRule(blankRule(draft.rules.length, t.newRuleName))
  }
  function removeRule(index: number) {
    const rule = draft.rules[index]
    if (!window.confirm(t.deleteRuleConfirm(pricingDescription(rule.description)))) return
    setDraft({
      ...draft,
      rules: draft.rules
        .filter((_, i) => i !== index)
        .map((rule, priority) => ({ ...rule, priority })),
    })
  }

  const ruleRange = (rule: PricingRule) => {
    if (rule.minValue == null && rule.maxValue == null) return ''
    const unit = dimensionUnit(rule.category, t)
    if (rule.maxValue == null) return t.rangeFromUp(rule.minValue ?? 0, unit)
    return `${rule.minValue ?? 0}–${rule.maxValue} ${unit}`
  }
  const rulePrice = (rule: PricingRule) => {
    if (['PER_BLOCK', 'TIERED_BLOCK'].includes(rule.calculationType))
      return t.perBlock(
        formatVnd(rule.fixedAmount ?? 0),
        rule.unitSize ?? 1,
        dimensionUnit(rule.category, t),
      )
    if (rule.calculationType === 'PERCENT_OF_BASE') return t.percentOfBase(rule.percentage ?? 0)
    if (rule.calculationType === 'MULTIPLIER') return t.multiplierValue(rule.multiplier ?? 0)
    if (rule.calculationType === 'MANUAL_QUOTE') return t.manualQuote
    return formatVnd(rule.fixedAmount ?? rule.baseAmount ?? 0)
  }
  const roundingLabel = (rounding: PricingRule['roundingMode']) =>
    rounding === 'FLOOR' ? t.roundDown : rounding === 'HALF_UP' ? t.roundNearest : t.roundUp
  const categorySummary = (list: PricingRule[]) => {
    const preview = list.slice(0, 2).map((rule) => {
      const range = ruleRange(rule)
      return `${range ? `${range}: ` : ''}${rulePrice(rule)}`
    })
    const remaining = list.length - preview.length
    return `${preview.join(' · ')}${remaining > 0 ? t.andMore(remaining) : ''}`
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
              <span className="pricing-rule-kind">{pricingLabel(rule.calculationType)}</span>
              <h4>{pricingDescription(rule.description)}</h4>
              <code>{rule.ruleKey}</code>
            </div>
            <Tag bordered={false} color={rule.enabled ? 'success' : 'default'}>
              {rule.enabled ? t.ruleActive : t.ruleOff}
            </Tag>
          </div>
          <dl className="pricing-rule-summary">
            {ruleRange(rule) && (
              <div>
                <dt>{t.ruleRange}</dt>
                <dd>{ruleRange(rule)}</dd>
              </div>
            )}
            <div>
              <dt>{t.ruleCalc}</dt>
              <dd>{rulePrice(rule)}</dd>
            </div>
            {isDimensionBlockRule(rule) && (
              <div>
                <dt>{t.ruleRounding}</dt>
                <dd>{roundingLabel(rule.roundingMode)}</dd>
              </div>
            )}
          </dl>
          <div className="pricing-card-actions">
            <Button size="small" onClick={() => setEditingRule(index)}>
              {t.edit}
            </Button>
            <Button
              size="small"
              danger
              type="text"
              aria-label={t.deleteRuleNamed(pricingDescription(rule.description))}
              title={t.deleteRule}
              onClick={() => removeRule(index)}
            >
              ×
            </Button>
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
        .filter((entry) => !isMediaRule(entry.rule) && entry.rule.category === category),
    }))
    .filter((group) => group.items.length > 0)

  const actions = (
    <div className="ppd-actions">
      <Button disabled={busy} onClick={onCancel}>
        {dirty ? t.discard : t.close}
      </Button>
      <Button disabled={busy || !canSubmit} onClick={onSave}>
        {t.saveDraft}
      </Button>
      <Button type="primary" disabled={busy || !canSubmit} onClick={onPublish}>
        {t.publish}
      </Button>
    </div>
  )

  const commonPage = (
    <div className="ppd-page" role="tabpanel">
      <label className="ppd-name">
        {t.policyName}
        <Input
          value={pricingPolicyName(draft.name)}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>

      <CardComponent aria-label={t.guardrails}>
        <h3>{t.guardrails}</h3>
        <p className="ppo-hint">{t.guardrailsHint}</p>
        <div className="pricing-policy-guardrails">
          <NumberField
            label={t.fieldMaxDiscount}
            value={draft.managerMaxDiscountPercent}
            onChange={(v) => {
              const percent = Math.min(100, Math.max(0, v))
              // The lowest price a Manager may reach is the system price less this discount, so the ratio follows it.
              setDraft({
                ...draft,
                managerMaxDiscountPercent: percent,
                minimumPriceRatio: Math.round((100 - percent) * 100) / 10000,
              })
            }}
          />
          <NumberField
            label={t.fieldMaxMarkup}
            value={draft.managerMaxMarkupPercent}
            onChange={(v) => setDraft({ ...draft, managerMaxMarkupPercent: v })}
          />
          <NumberField
            label={t.fieldHighRisk}
            value={draft.highRiskDiscountPercent}
            onChange={(v) => setDraft({ ...draft, highRiskDiscountPercent: v })}
          />
          <NumberField
            label={t.fieldFloorPrice}
            value={draft.minimumPrice}
            onChange={(v) => setDraft({ ...draft, minimumPrice: v })}
          />
        </div>
        <p className="ppo-hint">
          {t.guardrailsNote(Math.round(draft.minimumPriceRatio * 10000) / 100)}
        </p>
        {!guardrailsValid && (
          <Alert type="error" showIcon role="alert" message={t.guardrailsInvalid} />
        )}
      </CardComponent>

      <CustomerAddedPricingForm
        rules={draft.rules}
        onChange={(next) => setDraft({ ...draft, rules: next })}
      />

      <CardComponent aria-label={t.sharedTiersSection}>
        <h3>{t.sharedTiersSection}</h3>
        <p className="ppo-hint">{t.sharedTiersDraftHint}</p>
        <SharedMediaTiers
          rules={draft.rules}
          onChange={(next) => setDraft({ ...draft, rules: next })}
        />
      </CardComponent>
    </div>
  )

  const advancedPage = (
    <div className="ppd-page" role="tabpanel">
      <p className="ppo-hint">{t.advancedHint}</p>
      <div className="adm-card-head">
        <h3>{t.pricingRules}</h3>
        <Button onClick={addRule}>{t.addRule}</Button>
      </div>
      {newRule && (
        <section className="pricing-new-rule" aria-label={t.createRuleSection}>
          <header>
            <div>
              <span className="pricing-section-kicker">{t.newRuleKicker}</span>
              <h3>{t.createRuleSection}</h3>
            </div>
          </header>
          <PricingRuleEditor
            rule={newRule}
            onChange={(changes) =>
              setNewRule((current) => (current ? { ...current, ...changes } : current))
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
      {groups.length === 0 && <p className="ppo-empty">{t.noRules}</p>}
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
              <Tag bordered={false}>{t.ruleCount(group.items.length)}</Tag>
            </span>
            <span className="pricing-group-preview">
              {categorySummary(group.items.map((entry) => entry.rule))}
            </span>
          </summary>
          <div className="ppd-group-body pricing-rule-cards">
            {group.items.map((entry) => renderRule(entry.rule, entry.index))}
          </div>
        </details>
      ))}
      <details className="ppd-group">
        <summary>{t.advancedMedia}</summary>
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
  )

  return (
    <div className="ppd">
      <div className="ppd-bar">
        <div>
          <span className="ppo-eyebrow is-draft">{t.draftBadge}</span>
          <h3>{t.draftTitle(draft.version)}</h3>
          <p>{t.draftIntro}</p>
          {dirty && <Tag color="warning">{t.unsaved}</Tag>}
        </div>
        {actions}
      </div>
      {!mediaValid && (
        <Alert
          type="warning"
          showIcon
          role="alert"
          className="ppd-warning"
          message={t.mediaInvalid}
          description={
            <>
              <ul>
                {problems.map((problem) => {
                  const rule = draft.rules[problem.index]
                  return (
                    <li key={`${problem.index}-${problem.issue}`}>
                      <b>
                        {rule.pricingProfile ?? '?'} · {rule.mediaComponent ?? '?'}
                        {rule.checklistDefinitionName ? ` · ${rule.checklistDefinitionName}` : ''}{' '}
                        ({rule.minValue ?? 0}–{rule.maxValue ?? '∞'})
                      </b>
                      : {t.issues[problem.issue] ?? problem.issue}
                    </li>
                  )
                })}
              </ul>
              <Button size="small" onClick={() => setTab('advanced')}>
                {t.openAdvanced}
              </Button>
            </>
          }
        />
      )}

      <Tabs
        className="adm-tabs"
        activeKey={tab}
        onChange={(key) => setTab(key as Tab)}
        items={[
          { key: 'common', label: t.tabBasic },
          { key: 'advanced', label: t.tabAdvanced(ordinary.length) },
        ]}
      />

      {tab === 'common' && commonPage}
      {tab === 'advanced' && advancedPage}
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
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
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
  const { t } = useI18n(pricingConfigMessages)
  const block = ['PER_BLOCK', 'TIERED_BLOCK'].includes(rule.calculationType)
  const fixed = ['FIXED', 'PER_UNIT', 'PER_BLOCK', 'TIERED_BLOCK'].includes(rule.calculationType)
  const percentage = rule.calculationType === 'PERCENT_OF_BASE'
  const multiplier = ['MULTIPLIER', 'RESOURCE_BASED', 'ACTUAL_COST'].includes(rule.calculationType)
  const unit = dimensionUnit(rule.category, t)
  return (
    <div className="pricing-rule-editor">
      <fieldset>
        <legend>{t.general}</legend>
        <div className="pricing-field-grid">
          <div className="pricing-field">
            <span className="pricing-field-label">{t.category}</span>
            <Select<PricingRule['category']>
              aria-label={t.category}
              value={rule.category}
              getPopupContainer={mgrPopupContainer}
              onChange={(category) =>
                onChange({
                  category,
                  roundingMode: ['AREA', 'DISTANCE', 'ALTITUDE'].includes(category)
                    ? (rule.roundingMode ?? 'CEILING')
                    : null,
                })
              }
              options={categories.map((category) => ({
                value: category,
                label: pricingLabel(category),
              }))}
            />
          </div>
          <div className="pricing-field">
            <span className="pricing-field-label">{t.calculation}</span>
            <Select<PricingRule['calculationType']>
              aria-label={t.calculation}
              value={rule.calculationType}
              getPopupContainer={mgrPopupContainer}
              onChange={(calculationType) => {
                const nextBlock = ['PER_BLOCK', 'TIERED_BLOCK'].includes(calculationType)
                onChange({
                  calculationType,
                  unitSize: nextBlock ? (rule.unitSize ?? 1) : null,
                  roundingMode: nextBlock ? (rule.roundingMode ?? 'CEILING') : null,
                })
              }}
              options={calculationTypes.map((type) => ({
                value: type,
                label: pricingLabel(type),
              }))}
            />
          </div>
          <label className="pricing-field">
            <span className="pricing-field-label">{t.ruleKey}</span>
            <Input
              aria-label={t.ruleKey}
              value={rule.ruleKey}
              onChange={(event) => onChange({ ruleKey: event.target.value })}
            />
          </label>
          <label className="pricing-field pricing-field-wide">
            <span className="pricing-field-label">{t.ruleName}</span>
            <Input
              aria-label={t.ruleName}
              value={pricingDescription(rule.description)}
              onChange={(event) => onChange({ description: event.target.value })}
            />
          </label>
        </div>
      </fieldset>

      {(block || rule.minValue != null || rule.maxValue != null) && (
        <fieldset>
          <legend>{t.rangeSection}</legend>
          <div className="pricing-field-grid">
            <UnitInput
              label={t.valueFrom}
              suffix={unit}
              value={rule.minValue}
              onChange={(value) => onChange({ minValue: value })}
            />
            <UnitInput
              label={t.valueTo}
              suffix={unit}
              value={rule.maxValue}
              onChange={(value) => onChange({ maxValue: value })}
              helper={t.noUpperLimit}
            />
          </div>
        </fieldset>
      )}

      {rule.calculationType !== 'MANUAL_QUOTE' && (
        <fieldset>
          <legend>{t.pricingSection}</legend>
          <div className="pricing-field-grid">
            {block && (
              <UnitInput
                label={t.blockSize}
                suffix={unit}
                min={1}
                value={rule.unitSize}
                onChange={(value) => onChange({ unitSize: value })}
                helper={t.blockSizeHint}
              />
            )}
            {fixed && (
              <MoneyInput
                label={block ? t.pricePerBlock : t.fixedPrice}
                value={rule.fixedAmount}
                onChange={(value) => onChange({ fixedAmount: value })}
              />
            )}
            {percentage && (
              <UnitInput
                label={t.percentage}
                suffix="%"
                value={rule.percentage}
                onChange={(value) => onChange({ percentage: value })}
              />
            )}
            {multiplier && (
              <UnitInput
                label={t.multiplier}
                suffix={t.times}
                step={0.01}
                value={rule.multiplier}
                onChange={(value) => onChange({ multiplier: value })}
              />
            )}
            {block && isDimensionBlockRule(rule) && (
              <div className="pricing-field">
                <span className="pricing-field-label">{t.ruleRounding}</span>
                <Select<NonNullable<PricingRule['roundingMode']>>
                  aria-label={t.ruleRounding}
                  value={rule.roundingMode ?? 'CEILING'}
                  getPopupContainer={mgrPopupContainer}
                  onChange={(roundingMode) => onChange({ roundingMode })}
                  options={[
                    { value: 'CEILING', label: t.roundUp },
                    { value: 'FLOOR', label: t.roundDown },
                    { value: 'HALF_UP', label: t.roundNearest },
                  ]}
                />
              </div>
            )}
          </div>
        </fieldset>
      )}

      <div className="pricing-rule-editor-footer">
        <label className="pricing-switch">
          <Switch checked={rule.enabled} onChange={(enabled) => onChange({ enabled })} />
          {t.ruleActive}
        </label>
        <div className="pricing-card-actions">
          {onCancel && <Button onClick={onCancel}>{t.cancel}</Button>}
          <Button type="primary" onClick={onDone}>
            {create ? t.addRuleConfirm : t.done}
          </Button>
        </div>
      </div>
    </div>
  )
}

function blankRule(priority: number, description: string): PricingRule {
  return {
    category: 'AREA',
    calculationType: 'PER_BLOCK',
    ruleKey: `NEW_RULE_${priority + 1}`,
    description,
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

function dimensionUnit(category: PricingRule['category'], t: Messages) {
  if (category === 'AREA') return 'ha'
  if (category === 'DISTANCE') return 'km'
  if (category === 'ALTITUDE') return 'm'
  return t.unitGeneric
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
