import { cloneElement, type CSSProperties, type ReactElement } from 'react'
import { toolbarGroupStyle, buttonStyle } from './flightControlStyles'
import { flightControls } from './flightControlItems'
import { Icon } from './Icon'
import { inFlightControlMessages } from './InFlightControl.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { FlightCommand, IconName } from '../inFlightTypes'

const quickButtonLayout: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  minWidth: 0,
  height: 'auto',
  minHeight: 58,
  padding: '6px 4px',
  fontSize: 10,
  lineHeight: 1.2,
  whiteSpace: 'normal',
  overflowWrap: 'normal',
  gap: 4,
}

export function FlightControlsHeader({
  controlButton,
  onCommand,
  commandDisabled,
}: {
  controlButton: (item: {
    command: FlightCommand
    labelKey:
      | 'takeoff'
      | 'forward'
      | 'back'
      | 'left'
      | 'right'
      | 'land'
      | 'photo'
      | 'telemetry'
      | 'autoPlan'
      | 'eStop'
      | 'ascend'
      | 'descend'
      | 'yawLeft'
      | 'yawRight'
      | 'speedDown'
      | 'speedUp'
      | 'camera'
      | 'video'
      | 'lidar'
      | 'safety'
    icon: IconName
    tone?: 'danger' | 'amber' | undefined
  }) => ReactElement
  onCommand: (command: FlightCommand) => void
  commandDisabled: (command: FlightCommand) => boolean
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <div style={{ ...toolbarGroupStyle, alignContent: 'center' }}>
      <div
        style={{
          width: '100%',
          color: '#94a3b8',
          fontSize: 10,
          fontWeight: 850,
          marginBottom: 2,
        }}
      >
        {t.toolbar.quickActions}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          width: '100%',
          gap: 6,
        }}
      >
        {flightControls.map((item) => {
          const button = controlButton(item) as ReactElement<{
            style?: CSSProperties
          }>
          return cloneElement(button, {
            style: { ...button.props.style, ...quickButtonLayout },
          })
        })}
        <button
          onClick={() => onCommand('stop')}
          disabled={commandDisabled('stop')}
          style={{
            ...buttonStyle(),
            ...quickButtonLayout,
            background: 'rgba(20,83,45,.82)',
            color: '#86efac',
          }}
          title={t.toolbar.hover}
        >
          <Icon name="joystick" size={14} />
          <span>{t.toolbar.hover}</span>
        </button>
      </div>
    </div>
  )
}
