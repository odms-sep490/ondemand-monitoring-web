import { useMissionMonitoring } from '../../../../mission/hooks/useMissionMonitoring'
import { MonitoringChecklistSection } from '../../../../mission/components/MonitoringChecklistSection'
import type {
  EvidenceCandidate,
  MissionChecklistExecution,
} from '../../../../mission/types/checklistExecution'

/** Same execution contract as Mission Detail; media upload remains a separate operation. */
export function UploadMonitoringChecklist({
  missionId,
  revision,
  loadEvidenceCandidates,
  attachEvidenceCandidate,
}: {
  missionId: string
  revision: number
  loadEvidenceCandidates?: (page: number) => Promise<EvidenceCandidate[]>
  attachEvidenceCandidate?: (
    media: EvidenceCandidate,
    item: MissionChecklistExecution,
  ) => Promise<unknown>
}) {
  const query = useMissionMonitoring(missionId, revision, {
    autoRefresh: false,
  })
  return (
    <MonitoringChecklistSection
      missionId={missionId}
      data={query.data?.checklist}
      loading={query.loading}
      error={query.error}
      resultKnown={!query.loading && !query.error && Boolean(query.data)}
      resultStatus={query.data?.result?.approvalStatus}
      resultNote={query.data?.result?.reviewNote}
      canExecute={query.data?.permissions.canExecuteMonitoringChecklist}
      canAssess={query.data?.permissions.canInspectDevice === true}
      canAttach={query.data?.permissions.canAttachChecklistEvidence}
      canDetach={query.data?.permissions.canDetachChecklistEvidence}
      refresh={query.reload}
      loadEvidenceCandidates={loadEvidenceCandidates}
      attachEvidenceCandidate={attachEvidenceCandidate}
      compact
    />
  )
}
