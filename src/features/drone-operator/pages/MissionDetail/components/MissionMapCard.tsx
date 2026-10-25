import type { OperatorMission } from '../../../types/mission'
import { useOperatorMissionMap } from '../useOperatorMissionMap'

export function MissionMapCard({ mission }: { mission: OperatorMission }) {
  const { container, target } = useOperatorMissionMap(mission)

  return (
    <div className="odm-card" style={{ overflow: 'hidden' }}>
      <div
        className="mds-map-viewport"
        style={{
          position: 'relative',
          background: '#111827',
          overflow: 'hidden',
        }}
      >
        <div
          ref={container}
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          role="application"
          aria-label="Bản đồ vệ tinh mission"
        />

        {target ? (
          <div
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
              padding: '7px 10px',
              borderRadius: 8,
              background: 'rgba(254,242,242,.94)',
              color: '#991b1b',
              border: '1px solid rgba(239,68,68,.35)',
              fontSize: 11.5,
              fontWeight: 700,
              boxShadow: '0 2px 10px rgba(15,23,42,.10)',
              zIndex: 500,
            }}
          >
            ĐIỂM GIÁM SÁT · {target.latitude.toFixed(6)},{' '}
            {target.longitude.toFixed(6)}
          </div>
        ) : null}

        {mission.radiusMeters ? (
          <div
            style={{
              position: 'absolute',
              left: 10,
              bottom: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,.94)',
              color: 'var(--tx)',
              fontSize: 12,
              fontWeight: 700,
              boxShadow: '0 2px 10px rgba(15,23,42,.12)',
              zIndex: 500,
            }}
          >
            Bán kính giám sát: {Math.round(mission.radiusMeters)} m
          </div>
        ) : null}

        {target ? (
          <div
            style={{
              position: 'absolute',
              left: 10,
              top: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,.94)',
              color: 'var(--tx)',
              fontSize: 12,
              fontWeight: 700,
              boxShadow: '0 2px 10px rgba(15,23,42,.12)',
              zIndex: 500,
            }}
          >
            Đường bay: HOME → điểm giám sát
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(254,242,242,.94)',
            color: '#991b1b',
            border: '1px solid rgba(239,68,68,.35)',
            fontSize: 12,
            fontWeight: 700,
            boxShadow: '0 2px 10px rgba(15,23,42,.12)',
            zIndex: 500,
          }}
        >
          Vùng cấm bay Tân Sơn Nhất
        </div>
      </div>
    </div>
  )
}
