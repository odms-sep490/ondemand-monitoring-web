import { Alert } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'

export function BatteryWarningBanner({
  geofenceAlertActive,
  batteryState,
  batteryDisplay,
}: {
  geofenceAlertActive: boolean
  batteryState: 'NORMAL' | 'LOW' | 'CRITICAL' | 'EMERGENCY'
  batteryDisplay: string
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <Alert
      className="stf-flight-banner"
      style={{ top: geofenceAlertActive ? 92 : 20 }}
      type={batteryState === 'LOW' ? 'warning' : 'error'}
      showIcon
      message={
        <strong>
          {batteryState === 'LOW'
            ? t.batteryWarning.low
            : batteryState === 'CRITICAL'
              ? t.batteryWarning.critical
              : t.batteryWarning.emergency}{' '}
          - {batteryDisplay}
        </strong>
      }
      description={t.batteryWarning.note}
    />
  )
}
