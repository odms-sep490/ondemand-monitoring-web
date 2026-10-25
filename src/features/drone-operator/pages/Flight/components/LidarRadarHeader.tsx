import { Icon } from './Icon'
import { inFlightControlMessages } from './InFlightControl.messages'
import { useI18n } from '../../../../../shared/i18n'

export function LidarRadarHeader({
  panelBorder,
  statusLabel,
  maxRange,
}: {
  panelBorder: {
    fill: string
    stroke: string
    text: string
    badgeBg: string
    badgeBorder: string
    icon: string
  }
  statusLabel: string
  maxRange: number
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        height: 36,
        padding: '0 9px',
        borderBottom: '1px solid rgba(148,163,184,.16)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          color: '#67e8f9',
          fontSize: 10,
          fontWeight: 950,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
        }}
      >
        <Icon name="radar" size={15} />
        {t.lidarRadar.title}
      </span>
      <div
        style={{
          marginLeft: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <strong
          style={{
            borderRadius: 999,
            padding: '3px 8px',
            background: panelBorder.badgeBg,
            border: `1px solid ${panelBorder.badgeBorder}`,
            color: panelBorder.text,
            fontSize: 11,
            fontWeight: 950,
          }}
        >
          {statusLabel}
        </strong>
        <span style={{ color: '#cbd5e1', fontSize: 9 }}>
          {t.lidarRadar.range}
        </span>
        <strong
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 8,
            padding: '5px 7px',
            color: '#e5edf8',
            background: 'rgba(15,23,42,.58)',
            border: '1px solid rgba(148,163,184,.14)',
            fontFamily: 'var(--font-data)',
            fontSize: 12,
            fontWeight: 950,
          }}
        >
          {maxRange.toFixed(0)} m
          <Icon name="chevronRight" size={12} />
        </strong>
      </div>
    </div>
  )
}
