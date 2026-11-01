import type { OperatorMission } from '../../../types/mission'
import { useState } from 'react'
import { useOperatorMissionMap } from '../useOperatorMissionMap'

export function MissionMapCard({ mission }: { mission: OperatorMission }) {
  const [viewMode, setViewMode] = useState<'area' | 'route'>('area')
  const { container, target } = useOperatorMissionMap(mission, viewMode)
  const accessibleMapDescription = target
    ? `Điểm giám sát tại ${target.latitude.toFixed(6)}, ${target.longitude.toFixed(6)}. ${mission.radiusMeters ? `Vùng giám sát bán kính ${Math.round(mission.radiusMeters)} mét.` : ''} ${viewMode === 'route' ? 'Bản đồ hiển thị tuyến tham chiếu từ HOME đến điểm giám sát.' : 'Bản đồ tập trung vào vùng giám sát.'}`
    : 'Chưa có tọa độ hợp lệ để hiển thị điểm giám sát.'

  return (
    <section
      className="odm-card mds-map-card"
      aria-labelledby="mission-map-heading"
    >
      <div className="odm-card-header mds-map-header">
        <h2 id="mission-map-heading" className="mds-card-heading">
          Bản đồ nhiệm vụ
        </h2>
        <div
          className="mds-map-modes"
          role="group"
          aria-label="Chế độ xem bản đồ"
        >
          <button
            type="button"
            className={`mds-map-mode${viewMode === 'area' ? ' is-active' : ''}`}
            aria-pressed={viewMode === 'area'}
            disabled={!target}
            onClick={() => setViewMode('area')}
          >
            Vùng giám sát
          </button>
          <button
            type="button"
            className={`mds-map-mode${viewMode === 'route' ? ' is-active' : ''}`}
            aria-pressed={viewMode === 'route'}
            disabled={!target}
            onClick={() => setViewMode('route')}
          >
            Toàn tuyến
          </button>
        </div>
      </div>
      <div className="mds-map-viewport">
        <div
          ref={container}
          className="mds-leaflet-map"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          role="region"
          aria-label="Bản đồ vệ tinh nhiệm vụ"
          aria-describedby="mission-map-description"
        />
        <p id="mission-map-description" className="mds-sr-only">
          {accessibleMapDescription}
        </p>

        {mission.radiusMeters ? (
          <div className="mds-map-radius">
            Bán kính giám sát: {Math.round(mission.radiusMeters)} m
          </div>
        ) : null}

        <div className="mds-map-restriction">Vùng cấm bay Tân Sơn Nhất</div>
      </div>
    </section>
  )
}
