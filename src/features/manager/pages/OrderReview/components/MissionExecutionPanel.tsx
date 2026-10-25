import { useRef } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { checklistExecutionApi } from '../../../../mission/api/checklistExecutionApi'
import { MonitoringChecklistSection } from '../../../../mission/components/MonitoringChecklistSection'
import { MissionUploadedMedia } from '../../../../media/components/MissionUploadedMedia'
import { missionsApi } from '../../../api/missionsApi'
import { staffMissionMediaReader } from '../../../api/missionMediaReader'
import type { MissionResponse } from '../../../types/missions'
import { MissionResultReviewCard } from '../../../components/common/MissionResultReviewCard'

/** Mounted by exact selected ID, never by Order ID. Switching destroys old request/state. */
export function MissionExecutionPanel({
  mission,
}: {
  mission: MissionResponse
}) {
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
      aria-label={`Thực thi ${mission.missionCode}`}
    >
      <MonitoringChecklistSection
        hideImplementationHints
        missionId={mission.id}
        data={matchingChecklist}
        loading={checklist.loading}
        error={
          checklist.error
            ? new Error(
                'Không thể tải checklist của Mission này. Vui lòng thử lại.',
              )
            : undefined
        }
        resultKnown={!result.loading && !result.error}
        resultStatus={matchingResult?.approvalStatus}
        resultNote={matchingResult?.reviewNote}
        refresh={refresh}
      />
      {result.error ? (
        <p role="alert">
          Không thể tải kết quả của Mission này.{' '}
          <button className="odm-btn" onClick={result.reload}>
            Thử lại
          </button>
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
      <section ref={mediaLibrary} tabIndex={-1} aria-label="Thư viện media">
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
