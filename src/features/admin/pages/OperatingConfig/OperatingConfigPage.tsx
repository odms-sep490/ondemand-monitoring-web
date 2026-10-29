import { Tabs } from 'antd'
import { useState } from 'react'

import { PageHeader } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminApi } from '../../api/adminApi'
import { MockDataTag } from '../../components/common/MockDataTag'
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
    { key: 'pricing', label: t.pricingTab },
    { key: 'nfz', label: t.nfzTab },
  ]

  return (
    <div className="mgr-view">
      <PageHeader title={t.title} description={t.subtitle} actions={<MockDataTag />} />
      <Tabs
        className="adm-tabs"
        activeKey={tab}
        onChange={(key) => setTab(key as Tab)}
        items={tabs.map((item) => ({
          key: item.key,
          label: (
            <span>
              {item.label}
              <span className="adm-tab-count">{counts[item.key]}</span>
            </span>
          ),
        }))}
      />
      {tab === 'policy' && <PolicyTab />}
      {tab === 'pricing' && <PricingPolicyTab />}
      {tab === 'nfz' && <NoFlyZonesTab />}
    </div>
  )
}
