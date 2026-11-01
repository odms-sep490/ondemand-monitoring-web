import { List } from 'antd'

import { StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import {
  pricingLabel,
  pricingPolicyName,
} from '../../../../../shared/lib/pricingPresentation'
import type { PricingPolicy } from '../../../types/pricing'
import { pricingPolicyOverviewMessages } from './PricingPolicyOverview.messages'

/** Every policy version, newest first, with its status. */
export function PolicyVersionList({ policies }: { policies: PricingPolicy[] }) {
  const { t, locale } = useI18n(pricingPolicyOverviewMessages)
  const date = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale) : '—'
  const sorted = [...policies].sort((a, b) => b.version - a.version)
  return (
    <List
      size="small"
      locale={{ emptyText: t.noPolicies }}
      dataSource={sorted}
      renderItem={(policy) => (
        <List.Item key={policy.id}>
          <div className="ppo-version">
            <span>
              <b>
                {t.policyName(policy.version, pricingPolicyName(policy.name))}
              </b>
              <small className="ppo-version-dates">
                {policy.effectiveFrom
                  ? t.fromDate(date(policy.effectiveFrom))
                  : t.unpublished}
                {policy.effectiveTo ? t.toDate(date(policy.effectiveTo)) : ''}
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
          </div>
        </List.Item>
      )}
    />
  )
}
