import { Button } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n, useLanguage } from '../../../../../shared/i18n'
import {
  pricingLabel,
  pricingPolicyName,
} from '../../../../../shared/lib/pricingPresentation'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { migrateLegacyCustomerAdded } from '../../../lib/mediaPricingRules'
import type { PricingPolicy, PricingRule } from '../../../types/pricing'
import { pricingConfigMessages } from './pricingConfig.messages'
import './pricingPolicyOverview.css'

const CUSTOM = 'GENERIC_CUSTOMER_ADDED'

const customRule = (rules: PricingRule[], component: string) =>
  rules.find(
    (rule) =>
      rule.category === 'MEDIA' &&
      rule.enabled &&
      (rule.pricingProfile ?? '').toUpperCase() === CUSTOM &&
      rule.mediaComponent === component,
  )

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="ppo-tile">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
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
  const { t } = useI18n(pricingConfigMessages)
  const { locale } = useLanguage()
  const date = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale) : '—'
  const number = (value: number | null | undefined, suffix = '') =>
    value == null ? '—' : `${value.toLocaleString(locale)}${suffix}`
  /** One line of a tier list: "0–10 ảnh: 50.000 ₫ mỗi 10 ảnh". */
  const tierLine = (rule: PricingRule, noun: string) => {
    const from = rule.minValue ?? 0
    const range = rule.maxValue == null ? t.tierFrom(from) : `${from}–${rule.maxValue}`
    const block =
      rule.unitSize && rule.unitSize > 1
        ? t.tierEveryN(rule.unitSize, noun)
        : t.tierEach(noun)
    return `${range} ${noun}: ${formatVnd(rule.fixedAmount ?? 0)}${block}`
  }
  // Policies from before the GENERIC_CUSTOMER_ADDED profile keep these prices under CUSTOM; show what the engine uses.
  const customerRules = migrateLegacyCustomerAdded(active?.rules ?? [])
  const tiers = (component: string) =>
    (active?.rules ?? [])
      .filter(
        (rule) =>
          rule.category === 'MEDIA' &&
          rule.enabled &&
          rule.mediaComponent === component &&
          (rule.pricingProfile ?? '').toUpperCase() === 'DEFAULT',
      )
      .sort((a, b) => (a.minValue ?? 0) - (b.minValue ?? 0))
  const imageTiers = tiers('EXTRA_IMAGE')
  const videoTiers = tiers('EXTRA_VIDEO')
  const sorted = [...policies].sort((a, b) => b.version - a.version)

  return (
    <div className="ppo">
      <header className="ppo-head">
        <h2>{t.overviewTitle}</h2>
        <p>{t.overviewIntro}</p>
      </header>

      {draft && (
        <CardComponent role="region" aria-label={t.draftSection}>
          <p className="ppo-note">
            {t.draftExists(draft.version)}{' '}
            {onEditDraft && (
              <Button size="small" onClick={onEditDraft}>
                {t.continueDraft}
              </Button>
            )}
          </p>
        </CardComponent>
      )}

      {active ? (
        <>
          <CardComponent className="ppo-active" role="region" aria-label={t.activeSection}>
            <div className="ppo-active-head">
              <div>
                <span className="ppo-eyebrow">{t.inForce}</span>
                <h3>{t.policyVersion(active.version, pricingPolicyName(active.name))}</h3>
                <small>{t.effectiveSince(date(active.effectiveFrom), active.rules.length)}</small>
              </div>
              <Button type="primary" disabled={busy || draft !== null} onClick={onClone}>
                {t.newDraft}
              </Button>
            </div>
            <p role="note" className="ppo-note">
              {t.activeReadonly}
            </p>
            <dl className="ppo-tiles">
              <Tile label={t.maxDiscount} value={number(active.managerMaxDiscountPercent, '%')} />
              <Tile label={t.maxMarkup} value={number(active.managerMaxMarkupPercent, '%')} />
              <Tile label={t.highRisk} value={number(active.highRiskDiscountPercent, '%')} />
              <Tile label={t.floorRatio} value={number(active.minimumPriceRatio)} />
              <Tile label={t.floorPrice} value={formatVnd(active.minimumPrice)} />
            </dl>
          </CardComponent>

          <CardComponent role="region" aria-label={t.customerAddedSection}>
            <h3>{t.customerAddedSection}</h3>
            <p className="ppo-hint">{t.customerAddedFormula}</p>
            <dl className="ppo-tiles">
              <Tile
                label={t.basePriceTile}
                value={formatVnd(customRule(customerRules, 'CHECKLIST_BASE')?.fixedAmount ?? 0)}
              />
              <Tile
                label={t.includedImagesTile}
                value={number(customRule(customerRules, 'INCLUDED_IMAGE')?.includedQuantity ?? 0)}
              />
              <Tile
                label={t.includedVideosTile}
                value={number(customRule(customerRules, 'INCLUDED_VIDEO')?.includedQuantity ?? 0)}
              />
              <Tile
                label={t.includedAreaTile}
                value={number(
                  customRule(customerRules, 'INCLUDED_AREA')?.includedQuantity ?? 0,
                  ' ha',
                )}
              />
              <Tile
                label={t.extraAreaTile}
                value={
                  customRule(customerRules, 'EXTRA_AREA')
                    ? formatVnd(customRule(customerRules, 'EXTRA_AREA')?.fixedAmount ?? 0)
                    : t.notConfigured
                }
              />
            </dl>
          </CardComponent>

          <CardComponent role="region" aria-label={t.sharedTiersSection}>
            <h3>{t.sharedTiersSection}</h3>
            <p className="ppo-hint">{t.sharedTiersHint}</p>
            <div className="ppo-columns">
              <div>
                <strong>{t.extraImages}</strong>
                {imageTiers.length === 0 ? (
                  <p className="ppo-empty">{t.notConfigured}</p>
                ) : (
                  <ul>
                    {imageTiers.map((rule) => (
                      <li key={rule.ruleKey}>{tierLine(rule, t.nounImage)}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <strong>{t.extraVideos}</strong>
                {videoTiers.length === 0 ? (
                  <p className="ppo-empty">{t.notConfigured}</p>
                ) : (
                  <ul>
                    {videoTiers.map((rule) => (
                      <li key={rule.ruleKey}>{tierLine(rule, t.nounVideo)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardComponent>
        </>
      ) : (
        <CardComponent className="ppo-empty-card" role="note">
          <h3>{t.noActive}</h3>
          <p className="ppo-hint">{t.noActiveHint}</p>
        </CardComponent>
      )}

      <CardComponent role="region" aria-label={t.versionsSection}>
        <h3>{t.versionsSection}</h3>
        {sorted.length === 0 ? (
          <p className="ppo-empty">{t.noPolicies}</p>
        ) : (
          <ul className="ppo-versions">
            {sorted.map((policy) => (
              <li key={policy.id}>
                <span>
                  <b>{t.policyVersion(policy.version, pricingPolicyName(policy.name))}</b>
                  <small>
                    {policy.effectiveFrom ? t.fromDate(date(policy.effectiveFrom)) : t.notPublished}
                    {policy.effectiveTo ? t.untilDate(date(policy.effectiveTo)) : ''}
                  </small>
                </span>
                <StatusTag
                  tone={
                    policy.status === 'ACTIVE'
                      ? 'success'
                      : policy.status === 'DRAFT'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {pricingLabel(policy.status)}
                </StatusTag>
              </li>
            ))}
          </ul>
        )}
      </CardComponent>
    </div>
  )
}
