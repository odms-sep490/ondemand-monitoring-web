import { useI18n } from '../../../../shared/i18n'
import { simulationZonesMessages } from './SimulationZonesPage.messages'

export default function SimulationZones() {
  const { t } = useI18n(simulationZonesMessages)
  return (
    <div className="stf-zones">
      <header className="stf-zones-head">
        <h1 className="stf-zones-title">{t.title}</h1>
        <p className="stf-zones-desc">{t.description}</p>
      </header>
      <iframe
        title={t.iframeTitle}
        src="http://localhost:8080/simulation-viewer/index.html"
        className="stf-zones-frame"
      />
    </div>
  )
}
