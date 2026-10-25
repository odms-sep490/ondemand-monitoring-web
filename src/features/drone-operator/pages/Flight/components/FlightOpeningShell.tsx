import { useI18n } from '../../../../../shared/i18n'
import { flightPageMessages } from '../FlightPage.messages'

export function FlightOpeningShell() {
  const { t } = useI18n(flightPageMessages)
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#020617',
        color: '#dbeafe',
      }}
    >
      <div style={{ textAlign: 'center', fontWeight: 800 }}>{t.opening}</div>
    </main>
  )
}
