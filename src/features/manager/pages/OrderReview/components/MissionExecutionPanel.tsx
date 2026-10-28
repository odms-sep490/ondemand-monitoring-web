import { useRef } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { checklistExecutionApi } from '../../../../mission/api/checklistExecutionApi'
import { MonitoringChecklistSection } from '../../../../mission/components/MonitoringChecklistSection'
import { MissionUploadedMedia } from '../../../../media/components/MissionUploadedMedia'
import { missionsApi } from '../../../api/missionsApi'
import { staffMissionMediaReader } from '../../../api/missionMediaReader'
import type { MissionResponse } from '../../../types/missions'
import { MissionResultReviewCard } from '../../../components/common/MissionResultReviewCard'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { missionExecutionPanelMessages } from './MissionExecutionPanel.messages'

/** Mounted by exact selected ID, never by Order ID. Switching destroys old request/state. */
export function MissionExecutionPanel({
  mission,
}: {
  mission: MissionResponse
}) {
  const { t } = useI18n(missionExecutionPanelMessages)
  const mediaLibrary = useRef<HTMLElement>(null)
  const checklist = useApiQuery(
    (signal) =>
      checklistExecutionApi.getMissionChecklistExecutions(mission.id, signal),
    [mission.id],
  )
  const result = useApiQuery(
    (signal) => missionsApi.getMissionResult(mission.id, signal),
    [mission.id],
  )
  const refresh = () => {
    checklist.reload()
    result.reload()
  }
  const matchingChecklist =
    checklist.data?.missionId === mission.id ? checklist.data : undefined
  const matchingResult =
    result.data?.missionId === mission.id ? result.data : null
  return (
    <section
      className="odm-mission-execution"
      aria-label={t.execution(mission.missionCode)}
    >
      <MonitoringChecklistSection
        hideImplementationHints
        missionId={mission.id}
        data={matchingChecklist}
        loading={checklist.loading}
        error={checklist.error ? new Error(t.checklistLoadFailed) : undefined}
        resultKnown={!result.loading && !result.error}
        resultStatus={matchingResult?.approvalStatus}
        resultNote={matchingResult?.reviewNote}
        refresh={refresh}
      />
      {result.error ? (
        <p role="alert">
          {t.resultLoadFailed}{' '}
          <Button onClick={result.reload}>{t.retry}</Button>
        </p>
      ) : null}
      {matchingResult && (
        <MissionResultReviewCard
          mission={mission}
          result={matchingResult}
          checklist={matchingChecklist}
          checklistLoading={checklist.loading}
          checklistFailed={!!checklist.error}
          refreshing={result.loading}
          onReviewed={refresh}
          onViewMedia={() => {
            mediaLibrary.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
            mediaLibrary.current?.focus({ preventScroll: true })
          }}
        />
      )}
      <section ref={mediaLibrary} tabIndex={-1} aria-label={t.mediaLibrary}>
        <MissionUploadedMedia
          missionId={mission.id}
          missionStatus={mission.status}
          reader={staffMissionMediaReader}
          reviewStatus={matchingResult?.approvalStatus ?? null}
        />
      </section>
    </section>
  )
}
