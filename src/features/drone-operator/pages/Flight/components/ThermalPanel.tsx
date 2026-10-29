import { GlassPanel } from './GlassPanel'
import { Fragment } from 'react'
import { inFlightControlMessages } from './InFlightControl.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { ControlStatus } from '../inFlightTypes'

export function ThermalPanel({
  controlStatus,
  thermalRows,
}: {
  controlStatus: ControlStatus | null
  thermalRows: string[][]
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <GlassPanel
      style={{
        position: 'absolute',
        right: 16,
        top: 178,
        width: 260,
        padding: '12px 14px',
        border: controlStatus?.hotspotDetected
          ? '1px solid color-mix(in srgb, var(--fc-amber) 78%, transparent)'
          : '1px solid color-mix(in srgb, var(--fc-blue) 35%, transparent)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <strong
          style={{
            fontSize: 12,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: 'var(--fc-tx)',
          }}
        >
          {t.thermalPanel.title}
        </strong>
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color:
              controlStatus?.thermalSensorOnline === false
                ? 'var(--fc-red)'
                : 'var(--fc-blue)',
          }}
        >
          {controlStatus?.thermalSensorOnline === false
            ? t.thermalPanel.sensorOffline
            : t.thermalPanel.sensorOnline}
        </span>
      </div>
      <div
        style={{
          marginBottom: 8,
          fontSize: 12,
          fontWeight: 900,
          color: controlStatus?.hotspotDetected
            ? 'var(--fc-amber)'
            : 'var(--fc-tx)',
        }}
      >
        {controlStatus?.hotspotDetected
          ? t.thermalPanel.hotspotDetected
          : t.thermalPanel.noHotspot}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          rowGap: 5,
          columnGap: 12,
          fontSize: 11,
          color: 'var(--fc-tx)',
        }}
      >
        {thermalRows.map(([label, value]) => (
          <Fragment key={label}>
            <span>{label}</span>
            <strong
              style={{
                color:
                  label === t.thermalPanel.rows.max &&
                  controlStatus?.hotspotDetected
                    ? 'var(--fc-amber)'
                    : 'var(--fc-tx)',
                fontFamily: 'var(--font-data)',
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </strong>
          </Fragment>
        ))}
      </div>
      {controlStatus?.thermalSourceError && (
        <div
          style={{
            marginTop: 8,
            color: 'var(--fc-red)',
            fontSize: 10,
            lineHeight: 1.35,
          }}
        >
          {t.thermalPanel.error(controlStatus.thermalSourceError)}
        </div>
      )}
    </GlassPanel>
  )
}
