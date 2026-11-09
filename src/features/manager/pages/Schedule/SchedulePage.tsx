import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Alert, Button, Skeleton } from 'antd'

import { useAuthSession } from '../../../auth/hooks/useAuthSession'
import {
  operatorApi,
  type AvailableOperator,
} from '../../../staff/api/operatorApi'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { missionsApi, toMissionCalendarItem } from '../../api/missionsApi'
import { schedulePageMessages } from './SchedulePage.messages'
import '../../manager.css'
import '../../components/layout/mgrLayout.css'
import './schedule.scss'

const Office3DView = lazy(() =>
  import('./components/Office3DView').then((module) => ({
    default: module.Office3DView,
  })),
)

function sameOperatorRoster(
  previous: AvailableOperator[],
  next: AvailableOperator[],
) {
  return (
    previous.length === next.length &&
    previous.every((operator, index) => {
      const candidate = next[index]
      return (
        operator.id === candidate?.id &&
        operator.fullName === candidate.fullName &&
        operator.email === candidate.email
      )
    })
  )
}

export function SchedulePage({
  assignmentMissionId,
  assignmentCanEdit,
  assignmentReplaceStaffId,
  assignmentReturnOrderId,
}: {
  assignmentMissionId?: string
  assignmentCanEdit?: boolean
  assignmentReplaceStaffId?: string
  assignmentReturnOrderId?: string
}) {
  const { t, lang } = useI18n(schedulePageMessages)
  const { user } = useAuthSession()
  const staffQuery = useApiQuery(
    () => operatorApi.getAvailable(),
    [],
    sameOperatorRoster,
  )
  const assignmentCandidatesQuery = useApiQuery(
    () =>
      assignmentMissionId
        ? operatorApi.getAvailable(assignmentMissionId)
        : Promise.resolve([]),
    [assignmentMissionId],
    sameOperatorRoster,
  )
  const missionQuery = useApiQuery(
    (signal) => missionsApi.listMissions({ signal }),
    [],
  )
  const assignmentMissionQuery = useApiQuery(
    (signal) =>
      assignmentMissionId
        ? missionsApi
            .getMissionResponse(assignmentMissionId, signal)
            .then(toMissionCalendarItem)
        : Promise.resolve(null),
    [assignmentMissionId],
  )
  const [assignmentMissionSnapshot, setAssignmentMissionSnapshot] =
    useState<ReturnType<typeof toMissionCalendarItem> | null>(null)
  const assignmentMission =
    assignmentMissionSnapshot?.id === assignmentMissionId
      ? assignmentMissionSnapshot
      : (assignmentMissionQuery.data ?? null)
  const declinedStaffIds = new Set(
    assignmentMission?.staffAssignments
      ?.filter((assignment) => assignment.responseStatus === 'REJECTED')
      .map((assignment) => assignment.staffId) ?? [],
  )
  const replacementRoles = new Set(
    assignmentMission?.staffAssignments
      ?.filter(
        (assignment) =>
          assignment.staffId === assignmentReplaceStaffId &&
          assignment.isCurrent !== false,
      )
      .map((assignment) => assignment.assignedRole) ?? [],
  )
  const staffAlreadyAssignedForReplacement = new Set(
    assignmentMission?.staffAssignments
      ?.filter(
        (assignment) =>
          assignment.staffId !== assignmentReplaceStaffId &&
          assignment.isCurrent !== false &&
          replacementRoles.has(assignment.assignedRole),
      )
      .map((assignment) => assignment.staffId) ?? [],
  )
  const assignmentCandidates = assignmentMissionId
    ? (assignmentCandidatesQuery.data ?? []).filter(
        (candidate) =>
          !declinedStaffIds.has(candidate.id) &&
          !staffAlreadyAssignedForReplacement.has(candidate.id),
      )
    : (staffQuery.data ?? [])
  const missions = useMemo(() => {
    const listedMissions = missionQuery.data?.items ?? []
    const selectedMission = assignmentMission
    if (!selectedMission) return listedMissions
    return listedMissions.some((mission) => mission.id === selectedMission.id)
      ? listedMissions.map((mission) =>
          mission.id === selectedMission.id ? selectedMission : mission,
        )
      : [...listedMissions, selectedMission]
  }, [missionQuery.data?.items, assignmentMission])

  const reloadStaff = useCallback(() => {
    staffQuery.reload()
    if (assignmentMissionId) assignmentCandidatesQuery.reload()
  }, [assignmentMissionId, assignmentCandidatesQuery.reload, staffQuery.reload])

  useEffect(() => {
    let lastSyncAt = Date.now()
    const syncWhenVisible = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastSyncAt < 2_000) return
      lastSyncAt = now
      reloadStaff()
    }
    const interval = window.setInterval(syncWhenVisible, 30_000)
    window.addEventListener('focus', syncWhenVisible)
    document.addEventListener('visibilitychange', syncWhenVisible)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', syncWhenVisible)
      document.removeEventListener('visibilitychange', syncWhenVisible)
    }
  }, [reloadStaff])

  const hasError = Boolean(
    staffQuery.error ||
    (assignmentMissionId && assignmentCandidatesQuery.error) ||
    missionQuery.error ||
    assignmentMissionQuery.error,
  )
  const retry = () => {
    reloadStaff()
    missionQuery.reload()
    assignmentMissionQuery.reload()
  }

  return (
    <div
      className="mgr-view mgr-schedule mgr-office-page"
      aria-label={t.pageAriaLabel}
    >
      {hasError && (
        <Alert
          className="mgr-office-page-alert"
          type="warning"
          showIcon
          message={t.partialDataTitle}
          description={t.partialDataDescription}
          action={<Button onClick={retry}>{t.retry}</Button>}
        />
      )}

      <Suspense
        fallback={
          <div className="mgr-office-page-loading" aria-busy="true">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        }
      >
        <Office3DView
          staff={staffQuery.data ?? []}
          missions={missions}
          assignmentMissionId={assignmentMissionId}
          assignmentCanEdit={assignmentCanEdit === true}
          assignmentReplaceStaffId={assignmentReplaceStaffId}
          assignmentReturnOrderId={assignmentReturnOrderId}
          assignmentMission={assignmentMission}
          assignmentCandidates={assignmentCandidates}
          assignmentLoading={
            assignmentMissionQuery.loading ||
            (assignmentMissionId
              ? assignmentCandidatesQuery.loading &&
                assignmentCandidatesQuery.data === undefined
              : staffQuery.loading && staffQuery.data === undefined)
          }
          onAssignmentChanged={(updatedMission) => {
            if (updatedMission) setAssignmentMissionSnapshot(updatedMission)
            reloadStaff()
            missionQuery.reload()
            assignmentMissionQuery.reload()
          }}
          manager={
            user
              ? {
                  id: user.id,
                  fullName: user.fullName,
                  email: user.email,
                }
              : null
          }
          loading={
            (staffQuery.loading && staffQuery.data === undefined) ||
            missionQuery.loading ||
            Boolean(assignmentMissionId && assignmentMissionQuery.loading)
          }
          lang={lang}
        />
      </Suspense>
    </div>
  )
}
