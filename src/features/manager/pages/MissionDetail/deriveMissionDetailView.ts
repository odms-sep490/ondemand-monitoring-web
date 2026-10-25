import { assignmentReadiness } from '../../lib/assignmentReadiness'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import { formatOrderCode } from '../../components/common/format'
import {
  formatDateTime,
  formatDuration,
} from '../../components/common/missionDetailHelpers'
import { missionNextStep } from './missionNextStep'
import type { MissionDetailTab } from './missionDetailTypes'
import type { MissionResponse } from '../../types/missions'
import type { DetailData } from '../../components/common/missionDetailTypes'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { MissionChecklistResponse } from '../../../mission/types/checklistExecution'

export function deriveMissionDetailView({
  mission,
  detail,
  droneLookup,
  t,
  locale,
  checklist,
  tab,
}: {
  mission: MissionResponse
  detail: DetailData
  droneLookup: string | null
  t: (typeof missionDetailPageMessages)['vi']
  locale: 'vi-VN' | 'en-US'
  checklist: UseApiQueryState<MissionChecklistResponse>
  tab: MissionDetailTab
}) {
  const plan = mission.plan ?? null
  const { preflight, postcheck } = detail
  const staff = mission.staffAssignments ?? []
  const accepted = staff.filter((s) => s.responseStatus === 'ACCEPTED').length
  const canSetup = assignmentReadiness(mission).needsSetup
  const deviceCode =
    mission.deviceCode ??
    mission.droneCode ??
    postcheck?.deviceCode ??
    droneLookup ??
    null
  const deviceName = mission.deviceName ?? postcheck?.deviceName ?? null
  const deviceLabel = deviceCode
    ? `${deviceCode}${deviceName && deviceName !== deviceCode ? ` · ${deviceName}` : ''}`
    : '—'
  const startedAt =
    mission.actualStartAt ??
    mission.startedAt ??
    detail.result?.startedAt ??
    null
  const completedAt =
    mission.actualEndAt ??
    mission.completedAt ??
    detail.result?.endedAt ??
    detail.result?.completedAt ??
    null

  const rows: Array<{ label: string; value: string }> = [
    {
      label: t.fields.order,
      value: mission.orderCode ? formatOrderCode(mission.orderCode) : '—',
    },
    { label: t.fields.service, value: mission.serviceName ?? '—' },
    {
      label: t.fields.scheduledStart,
      value: formatDateTime(mission.scheduledStartAt, locale),
    },
    {
      label: t.fields.scheduledEnd,
      value: formatDateTime(mission.scheduledEndAt ?? null, locale),
    },
    {
      label: t.fields.started,
      value: startedAt ? formatDateTime(startedAt, locale) : t.notRecorded,
    },
    {
      label: t.fields.completed,
      value: completedAt ? formatDateTime(completedAt, locale) : t.notRecorded,
    },
    { label: t.fields.address, value: mission.address ?? '—' },
    {
      label: t.fields.coordinates,
      value:
        mission.latitude !== null && mission.longitude !== null
          ? `${mission.latitude}, ${mission.longitude}`
          : '—',
    },
    {
      label: t.fields.mediaType,
      value: mission.mediaSummary ?? mission.mediaType ?? '—',
    },
  ]
  const failure = mission.failureReason ?? mission.rejectionReason
  if (failure) rows.push({ label: t.fields.failure, value: failure })

  const mediaCount =
    detail.result?.mediaCount ??
    detail.result?.mediaFiles?.length ??
    detail.media.length
  const kpis: Array<{ label: string; value: string }> = [
    { label: t.kpi.customer, value: mission.customerName || '—' },
    {
      label: t.kpi.schedule,
      value: formatDateTime(mission.scheduledStartAt, locale),
    },
    { label: t.kpi.drone, value: deviceLabel },
    {
      label: t.kpi.crew,
      value: staff.length > 0 ? t.crewAccepted(accepted, staff.length) : '—',
    },
    { label: t.kpi.media, value: String(mediaCount) },
    detail.result?.durationSeconds != null
      ? {
          label: t.kpi.actualDuration,
          value: formatDuration(detail.result.durationSeconds),
        }
      : {
          label: t.kpi.duration,
          value:
            plan?.plannedDurationSec != null
              ? t.plannedSuffix(formatDuration(plan.plannedDurationSec))
              : t.notRecorded,
        },
  ]
  /** What the manager can do about this Mission right now. */
  const nextStep = missionNextStep(mission.status, accepted, staff.length)
  const isCompleted = mission.status === 'COMPLETED'
  const resultApproved = detail.result?.approvalStatus === 'APPROVED'
  const meaningfulText = (value: string | null | undefined) =>
    value && value.trim().length > 2 ? value.trim() : null
  const headline = meaningfulText(mission.orderTitle)
  const note = meaningfulText(mission.description)
  const checklistExecutions = checklist.data?.executions ?? []
  const compliantCount = checklistExecutions.filter(
    (item) => item.assessmentStatus === 'COMPLIANT',
  ).length
  const activeTab: MissionDetailTab = tab
  const tabs: Array<{ id: MissionDetailTab; label: string }> = [
    { id: 'result', label: t.tabs.result },
    { id: 'media', label: t.tabs.media },
    { id: 'checklist', label: t.tabs.checklist },
    { id: 'route', label: t.tabs.route },
    { id: 'order', label: t.tabs.order },
    { id: 'checks', label: t.tabs.checks },
  ]
  const waypoints = [...(plan?.waypoints ?? [])].sort(
    (a, b) => a.sequence - b.sequence,
  )
  return {
    plan,
    preflight,
    postcheck,
    staff,
    accepted,
    canSetup,
    deviceCode,
    deviceLabel,
    rows,
    kpis,
    nextStep,
    isCompleted,
    resultApproved,
    headline,
    note,
    checklistExecutions,
    compliantCount,
    activeTab,
    tabs,
    waypoints,
  }
}
