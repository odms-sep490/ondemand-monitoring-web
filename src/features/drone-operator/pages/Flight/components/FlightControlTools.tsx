import type { ReactElement } from 'react'
import { toolbarGroupStyle, buttonStyle } from './flightControlStyles'
import { copy } from './cockpitCopy'
import { Icon } from './Icon'
import { useI18n } from '../../../../../shared/i18n'
import { GlassPanel } from './GlassPanel'
import { moreToolControls, weatherControls } from './flightControlItems'
import { inFlightControlMessages } from './InFlightControl.messages'
import type { FlightCommand, IconName, WeatherPreset } from '../inFlightTypes'

export function FlightControlTools({
  onReviewMedia,
  busyCommand,
  onReferenceCapture,
  canFly,
  referenceBusy,
  onFinishFlight,
  commandDisabled,
  finishFlightBusy,
  onCommand,
  thermalEnabled,
  thermalLabel,
  onToggleMore,
  moreOpen,
  controlButton,
  onWeatherPreset,
}: {
  onReviewMedia: (() => void) | undefined
  busyCommand: FlightCommand | null
  onReferenceCapture: (() => void) | undefined
  canFly: boolean
  referenceBusy: boolean | undefined
  onFinishFlight: (() => void) | undefined
  commandDisabled: (command: FlightCommand) => boolean
  finishFlightBusy: boolean | undefined
  onCommand: (command: FlightCommand) => void
  thermalEnabled: boolean
  thermalLabel: string
  onToggleMore: () => void
  moreOpen: boolean
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
  onWeatherPreset: (preset: WeatherPreset) => void
}) {
  const { t, lang } = useI18n(inFlightControlMessages)
  const cc = copy[lang]
  return (
    <div
      style={{
        ...toolbarGroupStyle,
        alignContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          color: 'var(--fc-tx2)',
          fontSize: 10,
          fontWeight: 850,
          marginBottom: 2,
        }}
      >
        {t.toolbar.cameraTools}
      </div>
      {onReviewMedia && (
        <button
          onClick={onReviewMedia}
          disabled={busyCommand !== null}
          style={{ ...buttonStyle(), width: 62 }}
          title={t.toolbar.reviewMedia}
        >
          <Icon name="photo" size={14} />
          <span>{t.toolbar.review}</span>
        </button>
      )}
      {onReferenceCapture && (
        <button
          onClick={onReferenceCapture}
          disabled={!canFly || busyCommand !== null || referenceBusy}
          style={{ ...buttonStyle(), width: 62 }}
          title={cc.referenceTitle}
        >
          <Icon name="photo" size={14} />
          <span>
            {referenceBusy ? cc.referenceFetching : cc.referenceShort}
          </span>
        </button>
      )}
      {onFinishFlight && (
        <button
          onClick={onFinishFlight}
          disabled={commandDisabled('return_to_base') || finishFlightBusy}
          style={{
            ...buttonStyle(),
            width: 86,
            background:
              'color-mix(in srgb, color-mix(in srgb, var(--fc-green) 24%, var(--fc-panel)) 82%, transparent)',
            color: 'var(--fc-green)',
          }}
          title={t.toolbar.finishFlightTitle}
        >
          <Icon name="check" size={14} />
          <span>
            {finishFlightBusy ? t.toolbar.sending : t.toolbar.finishFlight}
          </span>
        </button>
      )}
      <button
        onClick={() => onCommand('thermal_toggle')}
        disabled={commandDisabled('thermal_toggle')}
        style={{
          ...buttonStyle(thermalEnabled ? 'amber' : undefined),
          width: 62,
        }}
        title={thermalLabel}
      >
        <Icon name="thermometer" size={14} />
        <span>
          {busyCommand === 'thermal_toggle' ? t.toolbar.sending : thermalLabel}
        </span>
      </button>
      <button
        onClick={onToggleMore}
        disabled={busyCommand !== null}
        style={buttonStyle()}
        title={t.toolbar.moreControls}
      >
        <Icon name="chevronRight" size={14} />
        <span>{t.toolbar.more}</span>
      </button>
      {moreOpen && (
        <GlassPanel
          style={{
            position: 'absolute',
            right: 0,
            bottom: 46,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 48px)',
            gap: 5,
            padding: 6,
            zIndex: 10,
          }}
        >
          {moreToolControls.map(controlButton)}
        </GlassPanel>
      )}
      <div
        style={{
          width: '100%',
          marginTop: 6,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(42px, 1fr))',
          gap: 4,
        }}
      >
        {weatherControls.map((item) => (
          <button
            key={item.preset}
            onClick={() => onWeatherPreset(item.preset)}
            disabled={!canFly || busyCommand !== null}
            style={{
              ...buttonStyle(item.tone),
              width: 'auto',
              height: 28,
              minWidth: 0,
              fontSize: 7,
            }}
            title={t.toolbar.weatherTitle(t.weather[item.labelKey])}
          >
            <Icon name="thermometer" size={11} />
            <span>{t.weather[item.labelKey]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
