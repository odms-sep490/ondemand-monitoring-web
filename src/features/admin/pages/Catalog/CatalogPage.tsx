import { useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { Icon, type IconName } from '../../../../shared/components/Icon'
import { catalogPageMessages } from './CatalogPage.messages'
import { ServicesTab } from './components/ServicesTab'
import { StationsTab } from './components/StationsTab'
import { TimeslotsTab } from './components/TimeslotsTab'
import './catalog.css'

type Tab = 'services' | 'timeslots' | 'stations'

export function CatalogPage() {
  const { t } = useI18n(catalogPageMessages)
  const [tab, setTab] = useState<Tab>('services')

  const tabs: Array<{ key: Tab; label: string; icon: IconName }> = [
    { key: 'services', label: t.services, icon: 'clipboard' },
    { key: 'timeslots', label: t.timeslots, icon: 'clock' },
    { key: 'stations', label: t.stations, icon: 'map-pin' },
  ]

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <span className="catalog-header-icon" aria-hidden="true">
          <Icon name="clipboard" width={26} height={26} />
        </span>
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </header>
      <div className="catalog-tabs" role="tablist" aria-label={t.title}>
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            id={`catalog-tab-${item.key}`}
            aria-controls="catalog-panel"
            onClick={() => setTab(item.key)}
            className={`catalog-tab${tab === item.key ? ' is-active' : ''}`}
          >
            <Icon name={item.icon} width={17} height={17} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>
      <div
        id="catalog-panel"
        role="tabpanel"
        aria-labelledby={`catalog-tab-${tab}`}
      >
        {tab === 'services' && <ServicesTab />}
        {tab === 'timeslots' && <TimeslotsTab />}
        {tab === 'stations' && <StationsTab />}
      </div>
    </div>
  )
}
