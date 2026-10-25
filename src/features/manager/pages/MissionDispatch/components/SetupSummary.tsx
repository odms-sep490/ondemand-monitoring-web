import { managerHref } from '../../../routes'
import type { Mission, ResourceSuggestions } from '../../../types/missions'
import type { Dispatch, SetStateAction } from 'react'

export function SetupSummary({
  mission,
  suggestions,
  assignedStaffCount,
  bothAssigned,
  setToast,
}: {
  mission: Mission
  suggestions: ResourceSuggestions
  assignedStaffCount: 0 | 1
  bothAssigned: boolean
  setToast: Dispatch<SetStateAction<string | null>>
}) {
  return (
    <div className="odm-mgr-setup-summary">
      <div>
        <div style={{ fontWeight: 700 }}>{mission.missionCode}</div>
        <div className="odm-mgr-review-hint">
          {suggestions.scheduledStart} ·{' '}
          {mission.droneId ? '1 Drone' : 'Chưa chọn Drone'} ·{' '}
          {assignedStaffCount}/1 vị trí nhân sự
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a className="odm-btn" href={managerHref({ screen: 'missions' })}>
          Quay lại
        </a>
        <button
          type="button"
          className="odm-btn odm-btn-ok"
          disabled={!bothAssigned}
          onClick={() =>
            setToast('Phân công thành công. Mission đang chờ nhân sự xác nhận.')
          }
        >
          Xác nhận phân công
        </button>
      </div>
    </div>
  )
}
