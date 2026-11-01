import { Alert, Button, Card, Empty } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { pricingPolicyName } from '../../../../../shared/lib/pricingPresentation'
import { migrateLegacyCustomerAdded } from '../../../lib/mediaPricingRules'
import type { PricingPolicy } from '../../../types/pricing'
import { PolicyStats } from './PolicyStats'
import { PolicyVersionList } from './PolicyVersionList'
import { CustomerAddedSummary, SharedTiersSummary } from './PolicyPrices'
import { pricingPolicyOverviewMessages } from './PricingPolicyOverview.messages'
import { numberIn } from './pricingOverview'
import './pricingPolicyOverview.css'

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
  const { t, locale } = useI18n(pricingPolicyOverviewMessages)
  const number = (value: number | null | undefined, suffix = '') =>
    numberIn(locale, value, suffix)
  // Policies from before the GENERIC_CUSTOMER_ADDED profile keep these prices under CUSTOM; show what the engine uses.
  const rules = migrateLegacyCustomerAdded(active?.rules ?? [])

  return (
    <div className="ppo">
      <header className="ppo-head">
        <h2>{t.title}</h2>
        <p>{t.intro}</p>
      </header>

      {draft && (
        <Card size="small" role="region" aria-label={t.draftAria}>
          <p className="ppo-note">
            {t.draftNote(draft.version)}{' '}
            {onEditDraft && (
              <Button htmlType="button" size="small" onClick={onEditDraft}>
                {t.continueDraft}
              </Button>
            )}
          </p>
        </Card>
      )}

      {active ? (
        <>
          <Card
            size="small"
            className="ppo-active"
            role="region"
            aria-label={t.activeAria}
          >
            <div className="ppo-active-head">
              <div>
                <span className="ppo-eyebrow">{t.activeEyebrow}</span>
                <h3>
                  {t.policyName(active.version, pricingPolicyName(active.name))}
                </h3>
                <small>
                  {t.effectiveSince(
                    active.effectiveFrom
                      ? new Date(active.effectiveFrom).toLocaleDateString(
                          locale,
                        )
                      : '—',
                    active.rules.length,
                  )}
                </small>
              </div>
              <Button
                type="primary"
                disabled={busy || draft !== null}
                onClick={onClone}
              >
                {t.createDraft}
              </Button>
            </div>
            <Alert type="info" showIcon role="note" message={t.readOnlyNote} />
            <PolicyStats
              stats={[
                {
                  key: 'discount',
                  label: t.maxDiscount,
                  value: number(active.managerMaxDiscountPercent, '%'),
                },
                {
                  key: 'markup',
                  label: t.maxMarkup,
                  value: number(active.managerMaxMarkupPercent, '%'),
                },
                {
                  key: 'risk',
                  label: t.highRisk,
                  value: number(active.highRiskDiscountPercent, '%'),
                },
                {
                  key: 'ratio',
                  label: t.minRatio,
                  value: number(active.minimumPriceRatio),
                },
                {
                  key: 'min',
                  label: t.minPrice,
                  value: formatVnd(active.minimumPrice),
                },
              ]}
            />
          </Card>
          <CustomerAddedSummary rules={rules} />
          <SharedTiersSummary rules={active.rules} />
        </>
      ) : (
        <Card size="small" role="note">
          <Empty
            description={
              <>
                <h3>{t.noActiveTitle}</h3>
                <p className="ppo-hint">{t.noActiveHint}</p>
              </>
            }
          />
        </Card>
      )}

      <Card
        size="small"
        role="region"
        aria-label={t.versionsTitle}
        title={t.versionsTitle}
      >
        <PolicyVersionList policies={policies} />
      </Card>
    </div>
  )
}
