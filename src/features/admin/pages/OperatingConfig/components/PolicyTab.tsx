import { useI18n } from '../../../../../shared/i18n'
import { PolicyTable } from './PolicyTable'
import { policyTabMessages } from './PolicyTab.messages'
import { WeightsPanel } from './WeightsPanel'

export function PolicyTab() {
  const { t } = useI18n(policyTabMessages)
  return (
    <div className="mgr-view">
      <section className="adm-section-block">
        <h2 className="adm-section-title">{t.operatingParams}</h2>
        <PolicyTable />
      </section>
      <section className="adm-section-block">
        <h2 className="adm-section-title">{t.dispatchWeights}</h2>
        <WeightsPanel />
      </section>
    </div>
  )
}
