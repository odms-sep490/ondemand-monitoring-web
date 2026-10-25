import { Icon } from './Icon'
import { inFlightControlMessages } from './InFlightControl.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'

export function MiniMapToolbar({
  setFollow,
  follow,
  setZoom,
}: {
  setFollow: Dispatch<SetStateAction<boolean>>
  follow: boolean
  setZoom: Dispatch<SetStateAction<number>>
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <div
      style={{
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        borderBottom: '1px solid rgba(148,163,184,.16)',
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      <button
        onClick={() => setFollow((value) => !value)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          border: 0,
          background: 'transparent',
          color: follow ? '#93c5fd' : '#cbd5e1',
          fontSize: 11,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        <Icon name="map" size={14} /> {t.map.title}
      </button>
      <span style={{ display: 'flex', gap: 5 }}>
        <button
          onClick={() =>
            setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))
          }
          style={{
            border: 0,
            background: 'transparent',
            color: '#cbd5e1',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
          title={t.map.zoomOut}
        >
          <Icon name="minus" size={12} />
        </button>
        <button
          onClick={() =>
            setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))
          }
          style={{
            border: 0,
            background: 'transparent',
            color: '#cbd5e1',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
          title={t.map.zoomIn}
        >
          <Icon name="plus" size={12} />
        </button>
      </span>
    </div>
  )
}
