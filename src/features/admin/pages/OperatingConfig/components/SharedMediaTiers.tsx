import { Alert, Button, Tag } from 'antd'
import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  newMediaRule,
  validateMediaRules,
} from '../../../lib/mediaPricingRules'
import type { MediaPricingComponent, PricingRule } from '../../../types/pricing'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { MoneyInput, UnitInput } from './PricingInputs'
import { pricingConfigMessages } from './pricingConfig.messages'

type Kind = {
  component: Extract<MediaPricingComponent, 'EXTRA_IMAGE' | 'EXTRA_VIDEO'>
  noun: 'nounImage' | 'nounVideo'
  title: 'extraImages' | 'extraVideos'
}

const KINDS: Kind[] = [
  { component: 'EXTRA_IMAGE', noun: 'nounImage', title: 'extraImages' },
  { component: 'EXTRA_VIDEO', noun: 'nounVideo', title: 'extraVideos' },
]

const SHARED_PROFILE = 'DEFAULT'

const isShared = (rule: PricingRule, component: MediaPricingComponent) =>
  rule.category === 'MEDIA' &&
  (rule.pricingProfile ?? '').toUpperCase() === SHARED_PROFILE &&
  !rule.checklistDefinitionId &&
  rule.mediaComponent === component

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
  const { t } = useI18n(pricingConfigMessages)
  const [editing, setEditing] = useState<number | null>(null)
  const problems = validateMediaRules(rules)
  const patch = (index: number, changes: Partial<PricingRule>) =>
    onChange(
      rules.map((rule, i) => (i === index ? { ...rule, ...changes } : rule)),
    )
  const roundingLabel = (rounding: PricingRule['roundingMode']) =>
    rounding === 'FLOOR'
      ? t.roundDown
      : rounding === 'HALF_UP'
        ? t.roundNearest
        : t.roundUp
  const tierRange = (rule: PricingRule, kind: Kind) => {
    const from = (rule.minValue ?? 0) + 1
    const to = rule.maxValue
    const video = kind.component === 'EXTRA_VIDEO'
    if (video && from === 1 && to === 1) return t.firstVideo
    if (to == null) return video ? t.videoFrom(from) : t.imageFrom(from)
    return video ? t.videoRange(from, to) : t.imageRange(from, to)
  }
  return (
    <div className="ppd-media">
      {KINDS.map((kind) => {
        const title = t[kind.title]
        const noun = t[kind.noun]
        const rows = rules
          .map((rule, index) => ({ rule, index }))
          .filter((entry) => isShared(entry.rule, kind.component))
          .sort((a, b) => (a.rule.minValue ?? 0) - (b.rule.minValue ?? 0))
        return (
          <section key={kind.component} className="ppd-tier-group" aria-label={title}>
            <header className="pricing-tier-head">
              <div>
                <h4>{title}</h4>
                <p>{t.tierAppliesWhen(noun)}</p>
              </div>
              <Tag bordered={false}>{t.tierCount(rows.length)}</Tag>
            </header>
            {rows.length === 0 && <p className="ppo-empty">{t.tierEmpty}</p>}
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
                          label={t.tierFromLabel}
                          ariaLabel={t.tierFromAria(title)}
                          suffix={noun}
                          min={0}
                          value={rule.minValue ?? 0}
                          onChange={(value) => patch(index, { minValue: value ?? 0 })}
                          helper={t.tierFromHint}
                        />
                        <UnitInput
                          label={t.valueTo}
                          ariaLabel={t.tierToAria(title)}
                          suffix={noun}
                          min={1}
                          value={rule.maxValue ?? null}
                          onChange={(value) => patch(index, { maxValue: value })}
                          helper={t.tierToHint}
                        />
                        <UnitInput
                          label={t.blockSize}
                          ariaLabel={t.tierBlockAria(title)}
                          suffix={noun}
                          min={1}
                          value={rule.unitSize ?? null}
                          onChange={(value) => patch(index, { unitSize: value })}
                          helper={t.blockSizeHint}
                        />
                        <MoneyInput
                          label={t.pricePerBlock}
                          ariaLabel={t.tierPriceAria(title)}
                          value={rule.fixedAmount ?? null}
                          onChange={(value) => patch(index, { fixedAmount: value })}
                        />
                      </div>
                      <div className="pricing-card-actions">
                        <Button size="small" onClick={() => setEditing(null)}>
                          {t.done}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="pricing-tier-summary">
                        <strong>{tierRange(rule, kind)}</strong>
                        <span>
                          {t.perEvery(formatVnd(rule.fixedAmount ?? 0), rule.unitSize ?? 1, noun)}
                        </span>
                        <small>{roundingLabel(rule.roundingMode)}</small>
                      </div>
                      <div className="pricing-card-actions">
                        <Button size="small" onClick={() => setEditing(index)}>
                          {t.edit}
                        </Button>
                        <Button
                          size="small"
                          danger
                          type="text"
                          aria-label={t.deleteTierAria(noun, tierRange(rule, kind))}
                          title={t.deleteTier}
                          onClick={() => {
                            if (window.confirm(t.deleteTierConfirm(tierRange(rule, kind))))
                              onChange(rules.filter((_, i) => i !== index))
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    </>
                  )}
                  {own.length > 0 && (
                    <Alert
                      type="error"
                      showIcon
                      role="alert"
                      message={
                        <ul className="ppd-issues">
                          {own.map((p) => (
                            <li key={p.issue}>{t.issues[p.issue] ?? p.issue}</li>
                          ))}
                        </ul>
                      }
                    />
                  )}
                </article>
              )
            })}
            <Button
              size="small"
              onClick={() => {
                const next = [...rules, newMediaRule(SHARED_PROFILE, kind.component, rules)]
                onChange(next)
                setEditing(next.length - 1)
              }}
            >
              {t.addTier}
            </Button>
          </section>
        )
      })}
    </div>
  )
}
