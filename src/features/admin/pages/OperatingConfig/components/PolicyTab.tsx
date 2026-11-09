import { useI18n } from '../../../../../shared/i18n'
import { PolicyTable } from './PolicyTable'
import { OrderExpirationSettings } from './OrderExpirationSettings'
import { policyTabMessages } from './PolicyTab.messages'
import { WeightsPanel } from './WeightsPanel'

export function PolicyTab() {
  const { t } = useI18n(policyTabMessages)
  return (
    <div className="adm-stack">
      <section>
        <h2 className="adm-section-title">{t.operatingParams}</h2>
        <PolicyTable />
      </section>
      <section>
        <h2 className="adm-section-title">{t.expirationTimeouts}</h2>
        <OrderExpirationSettings />
      </section>
      <section>
        <h2 className="adm-section-title">{t.dispatchWeights}</h2>
        <WeightsPanel />
      </section>
    </div>
  )
}
