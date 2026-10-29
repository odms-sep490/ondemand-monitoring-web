import { Tabs } from 'antd'
import { useState } from 'react'

import { PageHeader } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { catalogPageMessages } from './CatalogPage.messages'
import { ServicesTab } from './components/ServicesTab'
import { StationsTab } from './components/StationsTab'
import { TimeslotsTab } from './components/TimeslotsTab'

type Tab = 'services' | 'timeslots' | 'stations'

export function CatalogPage() {
  const { t } = useI18n(catalogPageMessages)
  const [tab, setTab] = useState<Tab>('services')

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'services', label: t.services },
    { key: 'timeslots', label: t.timeslots },
    { key: 'stations', label: t.stations },
  ]

  return (
    <div className="mgr-view">
      <PageHeader title={t.title} description={t.subtitle} />
      <Tabs
        className="adm-tabs"
        activeKey={tab}
        onChange={(key) => setTab(key as Tab)}
        items={tabs}
      />
      {tab === 'services' && <ServicesTab />}
      {tab === 'timeslots' && <TimeslotsTab />}
      {tab === 'stations' && <StationsTab />}
    </div>
  )
}
