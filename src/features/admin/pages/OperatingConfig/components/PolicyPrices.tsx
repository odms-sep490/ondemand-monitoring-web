import { Card, Col, Empty, Row } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import type { PricingRule } from '../../../types/pricing'
import { PolicyStats } from './PolicyStats'
import { pricingPolicyOverviewMessages } from './PricingPolicyOverview.messages'
import {
  customerRule,
  numberIn,
  sharedTiers,
  tierLine,
} from './pricingOverview'

/** Customer-added prices of the policy in force. `rules` already has legacy CUSTOM prices migrated. */
export function CustomerAddedSummary({ rules }: { rules: PricingRule[] }) {
  const { t, locale } = useI18n(pricingPolicyOverviewMessages)
  const quantity = (component: string, suffix = '') =>
    numberIn(
      locale,
      customerRule(rules, component)?.includedQuantity ?? 0,
      suffix,
    )
  const extraArea = customerRule(rules, 'EXTRA_AREA')
  return (
    <Card
      size="small"
      role="region"
      aria-label={t.customerAddedTitle}
      title={t.customerAddedTitle}
    >
      <p className="ppo-hint">{t.customerAddedHint}</p>
      <PolicyStats
        stats={[
          {
            key: 'base',
            label: t.basePrice,
            value: formatVnd(
              customerRule(rules, 'CHECKLIST_BASE')?.fixedAmount ?? 0,
            ),
          },
          {
            key: 'images',
            label: t.includedImages,
            value: quantity('INCLUDED_IMAGE'),
          },
          {
            key: 'videos',
            label: t.includedVideos,
            value: quantity('INCLUDED_VIDEO'),
          },
          {
            key: 'area',
            label: t.includedArea,
            value: quantity('INCLUDED_AREA', t.ha),
          },
          {
            key: 'rate',
            label: t.extraAreaRate,
            value: extraArea
              ? formatVnd(extraArea.fixedAmount ?? 0)
              : t.notConfigured,
          },
        ]}
      />
    </Card>
  )
}

function TierColumn({
  title,
  tiers,
  noun,
}: {
  title: string
  tiers: PricingRule[]
  noun: string
}) {
  const { t } = useI18n(pricingPolicyOverviewMessages)
  return (
    <Col xs={24} md={12}>
      <strong>{title}</strong>
      {tiers.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t.notConfigured}
        />
      ) : (
        <ul className="ppo-tier-list">
          {tiers.map((rule) => (
            <li key={rule.ruleKey}>{tierLine(rule, noun, t)}</li>
          ))}
        </ul>
      )}
    </Col>
  )
}

/** The shared extra-image and extra-video price tiers of the policy in force. */
export function SharedTiersSummary({ rules }: { rules: PricingRule[] }) {
  const { t } = useI18n(pricingPolicyOverviewMessages)
  return (
    <Card
      size="small"
      role="region"
      aria-label={t.mediaTitle}
      title={t.mediaTitle}
    >
      <p className="ppo-hint">{t.mediaHint}</p>
      <Row gutter={[16, 16]}>
        <TierColumn
          title={t.extraImages}
          tiers={sharedTiers(rules, 'EXTRA_IMAGE')}
          noun={t.imageNoun}
        />
        <TierColumn
          title={t.extraVideos}
          tiers={sharedTiers(rules, 'EXTRA_VIDEO')}
          noun={t.videoNoun}
        />
      </Row>
    </Card>
  )
}
