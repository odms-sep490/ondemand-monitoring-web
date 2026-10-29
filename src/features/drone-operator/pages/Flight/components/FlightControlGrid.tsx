import { toolbarGroupStyle, buttonStyle } from './flightControlStyles'
import { movementControls, rotationControls } from './flightControlItems'
import { Icon } from './Icon'
import { inFlightControlMessages } from './InFlightControl.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { FlightCommand } from '../inFlightTypes'

export function FlightControlGrid({
  onCommand,
  commandDisabled,
  busyCommand,
}: {
  onCommand: (command: FlightCommand) => void
  commandDisabled: (command: FlightCommand) => boolean
  busyCommand: FlightCommand | null
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <div
      style={{
        ...toolbarGroupStyle,
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 46px)',
        alignContent: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          gridColumn: '1 / -1',
          color: 'var(--fc-tx2)',
          fontSize: 10,
          fontWeight: 850,
          marginBottom: 1,
        }}
      >
        {t.toolbar.manualControl}
      </div>
      {movementControls.map((item) => (
        <button
          key={item.labelKey}
          onClick={() => onCommand(item.command)}
          disabled={commandDisabled(item.command)}
          style={{
            width: 46,
            height: 29,
            borderRadius: 8,
            border:
              '1px solid color-mix(in srgb, var(--fc-tx2) 18%, transparent)',
            background: 'color-mix(in srgb, var(--fc-panel) 78%, transparent)',
            color: 'var(--fc-tx)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            cursor: 'pointer',
            fontSize: 7,
            fontWeight: 850,
            boxShadow:
              'inset 0 1px 0 color-mix(in srgb, black 5%, transparent)',
          }}
          title={t.controls[item.labelKey]}
        >
          <Icon name={item.icon} size={12} />
          <span>{t.controls[item.labelKey]}</span>
        </button>
      ))}
      {rotationControls.map((item) => (
        <button
          key={item.labelKey}
          onClick={() => onCommand(item.command)}
          disabled={commandDisabled(item.command)}
          style={{
            ...buttonStyle(),
            width: 46,
            height: 29,
            fontSize: 7,
          }}
          title={t.controls[item.labelKey]}
        >
          <Icon name={item.icon} size={12} />
          <span>
            {busyCommand === item.command
              ? t.toolbar.sending
              : t.controls[item.labelKey]}
          </span>
        </button>
      ))}
    </div>
  )
}
