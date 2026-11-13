import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Alert, Skeleton } from 'antd'

import { ApiError } from '../../../../../shared/api/httpClient'
import { getMissionStatusLabel } from '../../../../../shared/lib/statusTone'
import type { MissionStatus } from '../../../../../shared/types/domain'
import { checklistExecutionApi } from '../../../../mission/api/checklistExecutionApi'
import type {
  MissionChecklistExecution,
  MissionChecklistResponse,
} from '../../../../mission/types/checklistExecution'
import { missionsApi } from '../../../api/missionsApi'
import type {
  PersistedPostDeviceCheckResponse,
  PersistedPreflightCheckResponse,
  MissionResultResponse,
} from '../../../types/missions'
import './staffMissionActivity.scss'

type StaffMission = {
  id: string
  code: string
  title: string | null
  device: string | null
  status: MissionStatus
}

type Snapshot = {
  checklist: MissionChecklistResponse | null
  preflight: PersistedPreflightCheckResponse | null
  postflight: PersistedPostDeviceCheckResponse | null
  result: MissionResultResponse | null
}

function settledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value ?? null : null
}

async function optionalRequest<T>(
  request: Promise<T>,
  signal: AbortSignal,
): Promise<T | null> {
  try {
    return await request
  } catch (error) {
    if (signal.aborted) throw error
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

function statusText(status: string | null | undefined, isEnglish: boolean) {
  const labels: Record<string, { vi: string; en: string }> = {
    PLANNING: { vi: 'Đang lập kế hoạch', en: 'Planning' },
    CREATED: { vi: 'Đã tạo nhiệm vụ', en: 'Created' },
    WAITING_DEPOSIT: { vi: 'Chờ thanh toán cọc', en: 'Awaiting deposit' },
    PENDING_CONFIRMATION: { vi: 'Chờ staff & kiểm tra drone', en: 'Awaiting staff and drone checks' },
    RESOURCE_ASSIGNING: { vi: 'Đang phân công', en: 'Assigning resources' },
    WAITING_OPERATOR_ACCEPTANCE: { vi: 'Chờ staff nhận việc', en: 'Awaiting staff acceptance' },
    READY: { vi: 'Sẵn sàng nghiệm thu', en: 'Ready for acceptance' },
    SCHEDULED: { vi: 'Đã lên lịch', en: 'Scheduled' },
    CONNECTED: { vi: 'Đã kết nối thiết bị', en: 'Device connected' },
    PREFLIGHT_CHECKING: { vi: 'Đang pre-check', en: 'Pre-flight check in progress' },
    READY_TO_FLY: { vi: 'Sẵn sàng bay', en: 'Ready to fly' },
    FAILED_PREFLIGHT: { vi: 'Pre-check chưa đạt', en: 'Pre-flight check failed' },
    PENDING_APPROVAL: { vi: 'Chờ phê duyệt', en: 'Awaiting approval' },
    IN_FLIGHT: { vi: 'Đang bay', en: 'In flight' },
    RETURNING: { vi: 'Đang quay về', en: 'Returning' },
    POSTFLIGHT_CHECKING: { vi: 'Đang post-check', en: 'Post-flight check in progress' },
    AWAITING_REVIEW: { vi: 'Chờ nghiệm thu', en: 'Awaiting review' },
    PENDING_REVIEW: { vi: 'Chờ nghiệm thu', en: 'Awaiting review' },
    PENDING: { vi: 'Chưa bắt đầu', en: 'Not started' },
    CHECKING: { vi: 'Đang kiểm tra', en: 'In progress' },
    IN_PROGRESS: { vi: 'Đang thực hiện', en: 'In progress' },
    PASSED: { vi: 'Đạt', en: 'Passed' },
    FAILED: { vi: 'Không đạt', en: 'Failed' },
    STALE: { vi: 'Cần kiểm tra lại', en: 'Needs recheck' },
    UNKNOWN: { vi: 'Chưa xác định', en: 'Unknown' },
    NOT_APPLICABLE: { vi: 'Không áp dụng', en: 'Not applicable' },
    COMPLETED: { vi: 'Hoàn thành', en: 'Completed' },
    UNABLE_TO_VERIFY: { vi: 'Không thể xác minh', en: 'Unable to verify' },
    NOT_ASSESSED: { vi: 'Chưa nghiệm thu', en: 'Not reviewed' },
    COMPLIANT: { vi: 'Đạt nghiệm thu', en: 'Accepted' },
    NON_COMPLIANT: { vi: 'Chưa đạt nghiệm thu', en: 'Needs rework' },
    DRAFT: { vi: 'Bản nháp', en: 'Draft' },
    PENDING_MANAGER_APPROVAL: { vi: 'Chờ quản lý nghiệm thu', en: 'Awaiting manager review' },
    APPROVED: { vi: 'Đã nghiệm thu', en: 'Approved' },
    REJECTED: { vi: 'Cần chỉnh sửa', en: 'Changes requested' },
    CANCELLED: { vi: 'Đã huỷ', en: 'Cancelled' },
  }
  if (!status) return isEnglish ? 'Not started' : 'Chưa thực hiện'
  return labels[status]?.[isEnglish ? 'en' : 'vi'] ?? status.replaceAll('_', ' ')
}

function statusTone(status: string | null | undefined) {
  if (['PASSED', 'COMPLETED', 'COMPLIANT', 'APPROVED', 'READY', 'READY_TO_FLY'].includes(status ?? '')) {
    return 'success'
  }
  if (['FAILED', 'NON_COMPLIANT', 'REJECTED'].includes(status ?? '')) {
    return 'danger'
  }
  if ([
    'CHECKING',
    'IN_PROGRESS',
    'CONNECTED',
    'PREFLIGHT_CHECKING',
    'IN_FLIGHT',
    'RETURNING',
    'POSTFLIGHT_CHECKING',
    'AWAITING_REVIEW',
    'PENDING_REVIEW',
    'PENDING_MANAGER_APPROVAL',
  ].includes(status ?? '')) {
    return 'active'
  }
  return 'neutral'
}

function formatTime(value: string | null | undefined, isEnglish: boolean) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(isEnglish ? 'en-GB' : 'vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function ActivitySection({
  title,
  status,
  summary,
  open,
  isEnglish,
  children,
}: {
  title: string
  status: string | null | undefined
  summary: string
  open?: boolean
  isEnglish: boolean
  children: ReactNode
}) {
  return (
    <details className="mgr-office-activity-section" open={open}>
      <summary>
        <span className="mgr-office-activity-summary-copy">
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
        <span className={'mgr-office-activity-status is-' + statusTone(status)}>
          {statusText(status, isEnglish)}
        </span>
      </summary>
      <div className="mgr-office-activity-content">{children}</div>
    </details>
  )
}

function EmptyActivity({ children }: { children: ReactNode }) {
  return <p className="mgr-office-activity-empty">{children}</p>
}

function ChecklistItem({
  item,
  isEnglish,
}: {
  item: MissionChecklistExecution
  isEnglish: boolean
}) {
  const hasDetails = Boolean(
    item.description ||
    item.observation ||
    item.unableToVerifyReason ||
    item.updatedAt ||
    item.executionSteps?.length ||
    item.expectedOutputs?.length ||
    item.evidence?.length,
  )

  return (
    <article className="mgr-office-activity-item">
      <div className="mgr-office-activity-item-head">
        <strong>{item.content}</strong>
        <span className={'mgr-office-activity-status is-' + statusTone(item.executionStatus)}>
          {statusText(item.executionStatus, isEnglish)}
        </span>
      </div>
      <div className="mgr-office-activity-meta">
        <span>{isEnglish ? 'Acceptance' : 'Nghiệm thu'}: {statusText(item.assessmentStatus, isEnglish)}</span>
      </div>
      {hasDetails && (
        <details className="mgr-office-activity-subdetails">
          <summary>{isEnglish ? 'Task details' : 'Chi tiết công việc'}</summary>
          <div className="mgr-office-activity-detail-body">
            {item.description && <p>{item.description}</p>}
            {item.observation && (
              <p className="mgr-office-activity-note">
                {isEnglish ? 'Observation' : 'Ghi nhận'}: {item.observation}
              </p>
            )}
            {item.unableToVerifyReason && (
              <p className="mgr-office-activity-note">
                {isEnglish ? 'Reason' : 'Lý do'}: {item.unableToVerifyReason}
              </p>
            )}
            {item.updatedAt && (
              <small>
                {isEnglish ? 'Updated' : 'Cập nhật'}: {formatTime(item.updatedAt, isEnglish)}
              </small>
            )}
            {item.executionSteps && item.executionSteps.length > 0 && (
              <div>
                <strong>{isEnglish ? 'Steps' : 'Các bước'}</strong>
                <ol>
                  {item.executionSteps.map((step, index) => <li key={index}>{step}</li>)}
                </ol>
              </div>
            )}
            {item.expectedOutputs && item.expectedOutputs.length > 0 && (
              <p>
                <strong>{isEnglish ? 'Expected result:' : 'Kết quả cần đạt:'}</strong>{' '}
                {item.expectedOutputs.join(' · ')}
              </p>
            )}
            {item.evidence && item.evidence.length > 0 && (
              <small className="mgr-office-activity-evidence">
                {isEnglish
                  ? item.evidence.length + ' evidence files attached'
                  : item.evidence.length + ' tệp bằng chứng đã đính kèm'}
              </small>
            )}
          </div>
        </details>
      )}
    </article>
  )
}

export function StaffMissionActivity({
  mission,
  lang,
}: {
  mission: StaffMission
  lang: string
}) {
  const isEnglish = lang === 'en'
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const missionId = mission.id

  useEffect(() => {
    const controller = new AbortController()
    let refreshTimer: number | undefined

    const refresh = async () => {
      const results = await Promise.allSettled([
        checklistExecutionApi.getMissionChecklistExecutions(missionId, controller.signal),
        optionalRequest(missionsApi.getCurrentPreflight(missionId, controller.signal), controller.signal),
        optionalRequest(missionsApi.getCurrentPostDeviceCheck(missionId, controller.signal), controller.signal),
        optionalRequest(missionsApi.getMissionResult(missionId, controller.signal), controller.signal),
      ])
      if (controller.signal.aborted) return

      setSnapshot({
        checklist: settledValue(results[0]),
        preflight: settledValue(results[1]),
        postflight: settledValue(results[2]),
        result: settledValue(results[3]),
      })
      setHasError(results.some((result) => result.status === 'rejected'))
      setLoading(false)
      refreshTimer = window.setTimeout(() => void refresh(), 15000)
    }

    void refresh()
    return () => {
      controller.abort()
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer)
    }
  }, [missionId])

  const executions = snapshot?.checklist?.executions ?? []
  const completedExecutions = executions.filter(
    (item) => item.executionStatus === 'COMPLETED' || item.executionStatus === 'UNABLE_TO_VERIFY',
  ).length
  const flightStatuses: MissionStatus[] = ['IN_PROGRESS', 'IN_FLIGHT', 'RETURNING']
  const isFlightActive = flightStatuses.includes(mission.status)
  const isPostflightStage = mission.status === 'POSTFLIGHT_CHECKING'
  const isReviewStage = ['AWAITING_REVIEW', 'PENDING_REVIEW'].includes(mission.status)
  const preflight = snapshot?.preflight
  const postflight = snapshot?.postflight
  const result = snapshot?.result
  const preflightSummary = preflight
    ? preflight.passedChecks + '/' + preflight.totalChecks + (isEnglish ? ' passed' : ' mục đạt')
    : (isEnglish ? 'Not started' : 'Chưa thực hiện')
  const postflightSummary = postflight
    ? postflight.passedChecks + '/' + postflight.totalChecks + (isEnglish ? ' passed' : ' mục đạt')
    : (isEnglish ? 'Not started' : 'Chưa thực hiện')
  const checklistSummary = executions.length > 0
    ? completedExecutions + '/' + executions.length + (isEnglish ? ' completed' : ' mục đã xử lý')
    : (isEnglish ? 'Not started' : 'Chưa thực hiện')
  const reviewStatus = result?.approvalStatus ?? null
  const reviewSummary = result
    ? statusText(result.status, isEnglish)
    : (isEnglish ? 'Not started' : 'Chưa thực hiện')

  return (
    <div className="mgr-office-activity-card">
      <div className="mgr-office-activity-heading">
        <div>
          <strong>{mission.code}</strong>
          <small>
            {[mission.title, mission.device]
              .filter(Boolean)
              .join(' · ')}
          </small>
        </div>
        <span className={'mgr-office-activity-status is-' + (isFlightActive ? 'active' : statusTone(mission.status))}>
          {getMissionStatusLabel(mission.status, isEnglish ? 'en' : 'vi')}
        </span>
      </div>

      {loading && (
        <div className="mgr-office-activity-loading" role="status" aria-live="polite">
          <Skeleton active title={false} paragraph={{ rows: 2 }} />
        </div>
      )}
      {hasError && (
        <Alert
          className="mgr-office-activity-alert"
          type="warning"
          showIcon
          message={isEnglish ? 'Some activity details could not be loaded.' : 'Một vài chi tiết công việc chưa tải được.'}
        />
      )}

      {!loading && (
        <div className="mgr-office-activity-stack">
        <ActivitySection
          title={isEnglish ? 'Pre-flight' : 'Trước bay'}
          isEnglish={isEnglish}
          status={preflight?.status ?? null}
          summary={preflightSummary}
          open={mission.status === 'PREFLIGHT_CHECKING'}
        >
          {preflight?.items.length ? preflight.items.map((item) => (
            <div className="mgr-office-activity-check" key={item.checkType}>
              <span>
                <strong>{item.checkName}</strong>
                {item.message && <small>{item.message}</small>}
                {item.checkedAt && <small>{formatTime(item.checkedAt, isEnglish)}</small>}
              </span>
              <span className={'mgr-office-activity-status is-' + statusTone(item.status)}>
                {statusText(item.status, isEnglish)}
              </span>
            </div>
          )) : (
            <EmptyActivity>
              {isEnglish ? 'Not started.' : 'Chưa thực hiện.'}
            </EmptyActivity>
          )}
        </ActivitySection>

        <ActivitySection
          title={isEnglish ? 'Tasks & acceptance' : 'Checklist & nghiệm thu'}
          isEnglish={isEnglish}
          status={executions.length > 0
            ? (completedExecutions === executions.length ? 'COMPLETED' : 'IN_PROGRESS')
            : null}
          summary={checklistSummary}
        >
          {executions.length > 0 ? executions.map((item) => (
            <ChecklistItem key={item.id} item={item} isEnglish={isEnglish} />
          )) : (
            <EmptyActivity>
              {isEnglish ? 'Not started.' : 'Chưa thực hiện.'}
            </EmptyActivity>
          )}
        </ActivitySection>

        <ActivitySection
          title={isEnglish ? 'Flight' : 'Chuyến bay'}
          isEnglish={isEnglish}
          status={mission.status}
          summary={getMissionStatusLabel(mission.status, isEnglish ? 'en' : 'vi')}
          open={isFlightActive}
        >
          <div className="mgr-office-activity-flight">
            <span>
              {mission.status === 'RETURNING'
                ? (isEnglish ? 'The aircraft is returning to the landing point.' : 'Thiết bị đang quay về điểm hạ cánh.')
                : mission.status === 'IN_FLIGHT' || mission.status === 'IN_PROGRESS'
                  ? (isEnglish ? 'Mission operation is in progress.' : 'Nhiệm vụ đang được thực hiện.')
                  : (isEnglish ? 'Flight has not started according to the mission status.' : 'Theo trạng thái hệ thống, chuyến bay chưa bắt đầu.')}
            </span>
          </div>
        </ActivitySection>

        <ActivitySection
          title={isEnglish ? 'Post-flight' : 'Sau bay'}
          isEnglish={isEnglish}
          status={postflight?.status ?? null}
          summary={postflightSummary}
          open={isPostflightStage}
        >
          {postflight?.items.length ? postflight.items.map((item) => (
            <div className="mgr-office-activity-check" key={item.checkType}>
              <span>
                <strong>{item.checkName}</strong>
                {item.message && <small>{item.message}</small>}
                {item.checkedAt && <small>{formatTime(item.checkedAt, isEnglish)}</small>}
              </span>
              <span className={'mgr-office-activity-status is-' + statusTone(item.status)}>
                {statusText(item.status, isEnglish)}
              </span>
            </div>
          )) : (
            <EmptyActivity>
              {isEnglish ? 'Not started.' : 'Chưa thực hiện.'}
            </EmptyActivity>
          )}
        </ActivitySection>

        <ActivitySection
          title={isEnglish ? 'Acceptance' : 'Nghiệm thu'}
          isEnglish={isEnglish}
          status={reviewStatus}
          summary={reviewSummary}
          open={isReviewStage}
        >
          {result ? (
            <div className="mgr-office-activity-result">
              <div>
                <span>{isEnglish ? 'Acceptance' : 'Trạng thái nghiệm thu'}</span>
                <strong>{statusText(result.approvalStatus, isEnglish)}</strong>
              </div>
              {result.summary && <p>{result.summary}</p>}
              {result.notes && <p>{result.notes}</p>}
              {result.reviewNote && (
                <p className="mgr-office-activity-note">
                  {isEnglish ? 'Reviewer note' : 'Ghi chú nghiệm thu'}: {result.reviewNote}
                </p>
              )}
              {result.submittedAt && (
                <small>
                  {isEnglish ? 'Submitted' : 'Gửi nghiệm thu'}: {formatTime(result.submittedAt, isEnglish)}
                </small>
              )}
            </div>
          ) : (
            <EmptyActivity>
              {isEnglish ? 'Not started.' : 'Chưa thực hiện.'}
            </EmptyActivity>
          )}
        </ActivitySection>
        </div>
      )}
      <p className="mgr-office-activity-refresh">
        {isEnglish ? 'Activity refreshes every 15 seconds.' : 'Tự cập nhật mỗi 15 giây.'}
      </p>
    </div>
  )
}
