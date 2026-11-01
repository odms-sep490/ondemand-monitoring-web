import { Tabs } from 'antd'
import { useState } from 'react'

import { PageHeader } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { OrderExpirationSettings } from './components/OrderExpirationSettings'
import { PricingPolicyTab } from './components/PricingPolicyTab'
import { operatingConfigPageMessages } from './OperatingConfigPage.messages'

type Tab = 'pricing' | 'expiration'

export function OperatingConfigPage() {
  const { t } = useI18n(operatingConfigPageMessages)
  const [tab, setTab] = useState<Tab>('pricing')

  return (
    <div className="mgr-view">
      <PageHeader title={t.title} description={t.subtitle} />
      <Tabs
        className="adm-tabs"
        activeKey={tab}
        onChange={(key) => setTab(key as Tab)}
        items={[
          { key: 'pricing', label: t.pricingTab },
          { key: 'expiration', label: t.expirationTab },
        ]}
      />
      {tab === 'pricing' && <PricingPolicyTab />}
      {tab === 'expiration' && <OrderExpirationSettings />}
    </div>
  )
}
