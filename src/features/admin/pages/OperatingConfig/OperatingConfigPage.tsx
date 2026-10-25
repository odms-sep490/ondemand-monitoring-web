import { useState } from 'react'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminApi } from '../../api/adminApi'
import { MockDataBadge } from '../../../../shared/components/ui'
import { PageHeader } from '../../../../shared/components/ui'
import { NoFlyZonesTab } from './components/NoFlyZonesTab'
import { PolicyTab } from './components/PolicyTab'
import { PricingPolicyTab } from './components/PricingPolicyTab'
import { operatingConfigPageMessages } from './OperatingConfigPage.messages'

type Tab = 'policy' | 'pricing' | 'nfz'

export function OperatingConfigPage() {
  const { t } = useI18n(operatingConfigPageMessages)
  const [tab, setTab] = useState<Tab>('policy')
  const { data: policyData } = useApiQuery(
    (signal) => adminApi.listPolicies(signal),
    [],
  )
  const { data: weightsData } = useApiQuery(
    (signal) => adminApi.listWeights(signal),
    [],
  )
  const { data: nfzData } = useApiQuery(
    (signal) => adminApi.listNoFlyZones(signal),
    [],
  )

  const { data: pricingData } = useApiQuery(
    (signal) => adminApi.listPricingPolicies(signal),
    [],
  )

  const counts: Record<Tab, number> = {
    policy: (policyData?.items.length ?? 0) + (weightsData?.items.length ?? 0),
    nfz: nfzData?.items.length ?? 0,
    pricing: pricingData?.length ?? 0,
  }
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'policy', label: t.policyTab },
    { key: 'pricing', label: 'Định giá' },
    { key: 'nfz', label: t.nfzTab },
  ]

  return (
    <div>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={<MockDataBadge />}
      />
      <div className="adm-tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`adm-tab${tab === item.key ? ' is-active' : ''}`}
          >
            {item.label}
            <span className="adm-tab-count odm-mono">{counts[item.key]}</span>
          </button>
        ))}
      </div>
      {tab === 'policy' && <PolicyTab />}
      {tab === 'pricing' && <PricingPolicyTab />}
      {tab === 'nfz' && <NoFlyZonesTab />}
    </div>
  )
}
