// MNG-08: Mission detail & result page (opened from the mission list).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import type { MissionChecklistResponse } from '../../../mission/types/checklistExecution'
import { checklistExecutionApi } from '../../../mission/api/checklistExecutionApi'
import { Alert, Button, Skeleton } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { CardComponent } from '../../../../shared/components/antd'
import { ErrorState } from '../../components/common/ErrorState'
import { useI18n } from '../../../../shared/i18n'
import { type DetailData } from '../../components/common/missionDetailTypes'
import { managerHref } from '../../routes'
import { ManagerDeliveryPanel } from '../../../delivery/ManagerDeliveryPanel'
import '../../components/layout/mgrLayout.css'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import '../../manager.css'
import '../../components/common/missionPages.css'
import './missionDetail.scss'
import { type MissionDetailTab } from './missionDetailTypes'
import { useMissionDetailLoad } from './useMissionDetailLoad'
import { deriveMissionDetailView } from './deriveMissionDetailView'
import { MissionDetailHeader } from './components/MissionDetailHeader'
import { MissionPlanPanel } from './components/MissionPlanPanel'
import { MissionNextStep } from './components/MissionNextStep'
import { MissionDetailTabs } from './components/MissionDetailTabs'
import { OverviewTab } from './components/OverviewTab'
import './components/missionOrderLayout.css'
import { MissionChecksPanel } from './components/MissionChecksPanel'
import { authSession } from '../../../auth/api/authApi'
import {
  staffRejectionEventKeys,
  useManagerNotificationReadState,
} from '../../hooks/useManagerNavigationNotifications'

export function MissionDetailPage({
  missionId,
  resourceAlertKeys,
}: {
  missionId: string
  resourceAlertKeys?: string[]
}) {
  return (
    <MissionDetail
      key={missionId}
      missionId={missionId}
      resourceAlertKeys={resourceAlertKeys}
    />
  )
}

const missionDetailTabs: readonly MissionDetailTab[] = [
  'result',
  'media',
  'checklist',
  'route',
  'plan',
  'resources',
  'checks',
]

function readMissionDetailTab(hash: string): MissionDetailTab {
  const query = hash.split('?')[1] ?? ''
  const requestedTab = new URLSearchParams(query).get('tab')
  return missionDetailTabs.includes(requestedTab as MissionDetailTab)
    ? (requestedTab as MissionDetailTab)
    : 'result'
}

function MissionDetail({
  missionId,
  resourceAlertKeys,
}: {
  missionId: string
  resourceAlertKeys?: string[]
}) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  const managerId = authSession.getUser()?.id ?? 'manager'
  const { readState, markRead } = useManagerNotificationReadState(managerId)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [droneLookup, setDroneLookup] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const checklist = useApiQuery(
    (signal) =>
      !detail?.mission || detail.mission.status === 'PLANNING'
        ? Promise.resolve<MissionChecklistResponse>({
            missionId,
            legacySnapshot: false,
            readyForSubmission: false,
            executions: [],
          })
        : checklistExecutionApi.getMissionChecklistExecutions(
            missionId,
            signal,
          ),
    [missionId, revision, detail?.mission?.status],
  )
  const refreshDetail = () => setRevision((value) => value + 1)
  const [tab, setTab] = useState<MissionDetailTab>(() =>
    readMissionDetailTab(window.location.hash),
  )
  const mediaLibrary = useRef<HTMLElement>(null)
  const selectTab = useCallback(
    (nextTab: MissionDetailTab) => {
      setTab(nextTab)
      const [path] = window.location.hash.split('?')
      const nextHash = `${path || managerHref({ screen: 'missionDetail', missionId })}?tab=${encodeURIComponent(nextTab)}`
      if (window.location.hash !== nextHash) window.location.hash = nextHash
    },
    [missionId],
  )

  useEffect(() => {
    const syncTabFromLocation = () =>
      setTab(readMissionDetailTab(window.location.hash))
    window.addEventListener('hashchange', syncTabFromLocation)
    window.addEventListener('popstate', syncTabFromLocation)
    return () => {
      window.removeEventListener('hashchange', syncTabFromLocation)
      window.removeEventListener('popstate', syncTabFromLocation)
    }
  }, [])
  const detailResourceEventKeys = useMemo(
    () =>
      staffRejectionEventKeys(
        detail?.mission?.id ?? missionId,
        detail?.mission?.staffAssignments,
      ),
    [detail?.mission?.id, detail?.mission?.staffAssignments, missionId],
  )
  const allResourceEventKeys = useMemo(
    () => resourceAlertKeys ?? detailResourceEventKeys,
    [detailResourceEventKeys, resourceAlertKeys],
  )
  const resourceUnreadCount = allResourceEventKeys.filter(
    (eventId) => !readState.resources.includes(eventId),
  ).length

  useEffect(() => {
    if ((tab === 'plan' || tab === 'resources') && allResourceEventKeys.length > 0)
      markRead('resources', allResourceEventKeys)
  }, [allResourceEventKeys, markRead, tab])

  useMissionDetailLoad({
    setLoading,
    setError,
    missionId,
    setDetail,
    revision,
    detail,
    setDroneLookup,
  })

  const backLink = (
    <a className="mgr-back-link" href={managerHref({ screen: 'missions' })}>
      <ArrowLeftOutlined aria-hidden="true" /> {t.back}
    </a>
  )

  if (loading && (!detail || detail.mission?.id !== missionId)) {
    return (
      <div className="odm-or mgr-view mgr-md" aria-busy="true">
        {backLink}
        <CardComponent>
          <Skeleton active paragraph={{ rows: 1 }} />
        </CardComponent>
        <CardComponent>
          <Skeleton active paragraph={{ rows: 6 }} />
        </CardComponent>
      </div>
    )
  }

  const mission = detail?.mission
  if (error || !mission || !detail) {
    return (
      <div className="odm-or mgr-view mgr-md">
        {backLink}
        <ErrorState title={t.loadError} description={error ?? undefined} />
      </div>
    )
  }

  const {
    plan,
    preflight,
    postcheck,
    canSetup,
    nextStep,
    isCompleted,
    resultApproved,
    headline,
    checklistExecutions,
    compliantCount,
    activeTab,
    tabs,
    waypoints,
  } = deriveMissionDetailView({
    mission,
    detail,
    droneLookup,
    t,
    locale,
    checklist,
    tab,
  })

  const needsResourceReplacement =
    ['PENDING_CONFIRMATION', 'READY'].includes(mission.status) && (
      (mission.staffAssignments ?? []).some(
        assignment => assignment.isCurrent !== false && assignment.responseStatus === 'REJECTED',
      ) ||
      (mission.deviceAssignments ?? []).some(
        assignment => assignment.replacementRequestedAt && !assignment.replacementCompleted,
      )
    )

  return (
    <div className="odm-or mgr-view mgr-md">
      <MissionDetailHeader
        mission={mission}
        headline={headline}
        canSetup={canSetup}
      />
      {needsResourceReplacement ? (
        <Alert
          type="warning"
          showIcon
          message={t.replacementRequiredTitle}
          action={
            <Button type="primary" style={{ color: '#fff' }} onClick={() => selectTab('plan')}>
              {t.manageResources}
            </Button>
          }
        />
      ) : nextStep && !['FAILED', 'COMPLETED'].includes(mission.status) ? (
        <MissionNextStep nextStep={nextStep} />
      ) : null}

      {mission.status === 'FAILED' && (
        <Alert
          type="error"
          showIcon
          message={t.fields.failure}
          action={
            mission.orderId ? (
              <Button href={managerHref({ screen: 'orderReview', orderId: mission.orderId })}>
                {t.replanMission}
              </Button>
            ) : undefined
          }
          description={
            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {mission.failureReason?.trim() ||
                mission.rejectionReason?.trim() ||
                t.fields.failureNotRecorded}
            </div>
          }
        />
      )}

      <div className="mgr-md-workbench">
        <MissionDetailTabs
          tabs={tabs}
          activeTab={activeTab}
          setTab={selectTab}
          resourceUnreadCount={resourceUnreadCount}
        />

        <div
          className="mgr-md-tabpanel"
          role="tabpanel"
          id="mission-detail-panel"
          aria-labelledby={`mission-detail-tab-${activeTab}`}
          tabIndex={0}
        >
          <div
            className="mgr-md-overview"
            hidden={
              !(
                ['result', 'media', 'checklist', 'route'] as MissionDetailTab[]
              ).includes(activeTab)
            }
          >
            <OverviewTab
              activeTab={activeTab}
              onTabChange={selectTab}
              isCompleted={isCompleted}
              mission={mission}
              detail={detail}
              checklist={checklist}
              loading={loading}
              refreshDetail={refreshDetail}
              mediaLibrary={mediaLibrary}
              resultApproved={resultApproved}
              checklistExecutions={checklistExecutions}
              compliantCount={compliantCount}
              missionId={missionId}
              waypoints={waypoints}
              plan={plan}
            />
          </div>

          {activeTab === 'plan' && <MissionPlanPanel mission={mission} onUpdated={refreshDetail} />}

          {activeTab === 'checks' ? (
            <MissionChecksPanel
              key={mission.id}
              mission={mission}
              weather={detail.weather}
              preflight={preflight}
              postcheck={postcheck}
            />
          ) : null}

          {isCompleted && resultApproved ? (
            <div className="mgr-md-delivery" hidden={activeTab !== 'result'}>
              <ManagerDeliveryPanel
                allowLegacyPublication={
                  detail.result?.approvalStatus === 'APPROVED' &&
                  detail.result.inspectorConfirmed !== true
                }
                orderId={mission.orderId}
                refreshKey={revision}
                initialMissionId={mission.id}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
