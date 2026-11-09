import type { MissionResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionExecutionPanelMessages } from './MissionExecutionPanel.messages'
import { MissionExecutionContext } from './MissionExecutionContext'

/** Compact manager view for tracking execution progress and assigned resources. */
export function MissionExecutionPanel({
  mission,
}: {
  mission: MissionResponse
}) {
  const { t } = useI18n(missionExecutionPanelMessages)

  return (
    <section
      className="odm-mission-execution"
      aria-label={t.execution(mission.missionCode)}
    >
      <MissionExecutionContext mission={mission} />
    </section>
  )
}
