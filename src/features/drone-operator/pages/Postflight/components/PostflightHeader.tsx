import { Select } from 'antd'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { BackendMission } from '../../../api/liveMission'
import { DroneChip } from '../../../components/common/DroneChip'
import { FlightStepHeader } from '../../../components/common/FlightStepper'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { postflightPageMessages } from '../PostflightPage.messages'

export function PostflightHeader({
  missionLabel,
  postflightMissions,
  effectiveMissionId,
  selectMission,
  deviceLabel,
}: {
  missionLabel: string
  postflightMissions: BackendMission[]
  effectiveMissionId: string
  selectMission: (id: string) => void
  deviceLabel: string
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <FlightStepHeader
      title={t.stepTitle}
      missionId={missionLabel}
      active={6}
      right={
        <div className="stf-row" style={{ flexWrap: 'nowrap' }}>
          {postflightMissions.length > 0 && (
            <label className="stf-row" style={{ flexWrap: 'nowrap' }}>
              <span
                className="stf-muted"
                style={{ fontSize: 12.5, fontWeight: 700 }}
              >
                {t.selectMission}
              </span>
              <Select
                value={effectiveMissionId}
                onChange={(value) => selectMission(value)}
                style={{ minWidth: 220 }}
                getPopupContainer={mgrPopupContainer}
                options={postflightMissions.map((m) => ({
                  value: m.id,
                  label: `${m.missionCode || m.id} (${formatDeviceLabel(m) || 'DEVICE'}) — ${m.status}`,
                }))}
              />
            </label>
          )}
          <DroneChip label={deviceLabel} />
        </div>
      }
    />
  )
}
