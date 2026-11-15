import { InternalCorrectionPlanningPage } from '../../MissionCreate/InternalCorrectionPlanningPage'
import { EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { missionScopedAssignmentMessages } from './MissionScopedAssignment.messages'
import type { MissionResponse } from '../../../types/missions'
export function InternalCorrectionMissionSetup({
  mission,
}: {
  mission: MissionResponse
  onChanged: () => void
}) {
  const { t } = useI18n(missionScopedAssignmentMessages)
  if (!mission.inspectionSourceMissionId || !mission.inspectionCorrectionId)
    return <EmptyState title={t.loadError} />
  return (
    <InternalCorrectionPlanningPage
      orderId={mission.orderId}
      sourceMissionId={mission.inspectionSourceMissionId}
      correctionId={mission.inspectionCorrectionId}
    />
  )
}
