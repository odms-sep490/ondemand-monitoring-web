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
          ? '1px solid rgba(251,146,60,.78)'
          : '1px solid rgba(56,189,248,.35)',
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
            color: '#e5edf8',
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
                ? '#fca5a5'
                : '#67e8f9',
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
          color: controlStatus?.hotspotDetected ? '#fed7aa' : '#bae6fd',
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
          color: '#cbd5e1',
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
                    ? '#fed7aa'
                    : '#f8fafc',
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
            color: '#fca5a5',
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
