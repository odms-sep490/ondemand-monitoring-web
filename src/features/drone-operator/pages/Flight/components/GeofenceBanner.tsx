import { Alert } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { GeofenceStatus } from '../inFlightTypes'
import { inFlightControlMessages } from './InFlightControl.messages'

export function GeofenceBanner({
  geofenceTone,
  geofenceStatus,
  geofenceMessage,
}: {
  geofenceTone: string
  geofenceStatus: GeofenceStatus
  geofenceMessage: string
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <Alert
      className="stf-flight-banner"
      type={geofenceTone === 'danger' ? 'error' : 'warning'}
      showIcon
      message={
        <strong>
          {geofenceStatus.level === 'VIOLATION'
            ? t.geofence.breachTitle
            : t.geofence.warningTitle}
        </strong>
      }
      description={geofenceMessage}
    />
  )
}
