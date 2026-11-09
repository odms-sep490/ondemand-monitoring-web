import { FlightStepHeader } from '../../../components/common/FlightStepper'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { BackendMission } from '../../../api/liveMission'

export function PostflightHeader({
  missionLabel,
  postflightMissions,
  effectiveMissionId,
  selectMission,
}: {
  missionLabel: string
  postflightMissions: BackendMission[]
  effectiveMissionId: string
  selectMission: (id: string) => void
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <FlightStepHeader
      title={t.stepTitle}
      missionId={missionLabel}
      active={6}
      right={
        <div className="postflight-header-actions">
          {postflightMissions.length > 0 && (
            <label className="postflight-mission-select-label">
              <span>{t.selectMission}</span>
              <select
                value={effectiveMissionId}
                onChange={(e) => selectMission(e.target.value)}
                className="postflight-mission-select"
                aria-label={t.selectMission}
              >
                {postflightMissions.map((m) => (
                  <option key={m.id} value={m.id}>
                    🎯 {m.missionCode || m.id} (
                    {formatDeviceLabel(m) || 'DEVICE'}) — {m.status}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      }
    />
  )
}
