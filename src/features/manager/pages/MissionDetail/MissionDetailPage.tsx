// MNG-08: Mission detail & result page (opened from the mission list).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import type { MissionChecklistResponse } from '../../../mission/types/checklistExecution'
import { checklistExecutionApi } from '../../../mission/api/checklistExecutionApi'
import { Skeleton } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { CardComponent } from '../../../../shared/components/antd'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState as MgrEmptyState } from '../../components/common/EmptyState'
import { useI18n } from '../../../../shared/i18n'
import { OrderAttachmentsCard } from '../../components/common/OrderAttachmentsCard'
import { OrderCustomerCard } from '../../components/common/OrderCustomerCard'
import { OrderCustomerRequestDetails } from '../../components/common/OrderCustomerRequestDetails'
import { OrderServiceInfo } from '../../components/common/OrderServiceInfo'
import { type DetailData } from '../../components/common/missionDetailTypes'
import { managerHref } from '../../routes'
import { ManagerDeliveryPanel } from '../../../delivery/ManagerDeliveryPanel'
import '../../components/layout/mgrLayout.css'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import { orderReviewPageMessages } from '../OrderReview/OrderReviewPage.messages'
import '../../manager.css'
import '../../components/common/missionPages.css'
import './missionDetail.scss'
import { type MissionDetailTab } from './missionDetailTypes'
import { useMissionDetailLoad } from './useMissionDetailLoad'
import { deriveMissionDetailView } from './deriveMissionDetailView'
import { MissionDetailHeader } from './components/MissionDetailHeader'
import { MissionNextStep } from './components/MissionNextStep'
import { MissionDetailTabs } from './components/MissionDetailTabs'
import { OverviewTab } from './components/OverviewTab'
import { ChecksTab } from './components/ChecksTab'
import { MissionCrewCard } from './components/MissionCrewCard'
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
  'order',
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
  const { t: orderT } = useI18n(orderReviewPageMessages)
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
    if (tab === 'resources' && allResourceEventKeys.length > 0)
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
    staff,
    canSetup,
    deviceCode,
    deviceLabel,
    rows,
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
  } = deriveMissionDetailView({
    mission,
    detail,
    droneLookup,
    t,
    locale,
    checklist,
    tab,
  })

  return (
    <div className="odm-or mgr-view mgr-md">
      <MissionDetailHeader
        mission={mission}
        headline={headline}
        canSetup={canSetup}
      />

      {nextStep && mission.status !== 'FAILED' ? (
        <MissionNextStep nextStep={nextStep} />
      ) : null}

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

          {activeTab === 'order' ? (
            detail.order ? (
              <div className="mgr-md-order-layout">
                <div className="mgr-md-order-grid">
                  <div className="mgr-md-order-column">
                    <OrderServiceInfo order={detail.order} t={orderT} />
                    <OrderCustomerCard order={detail.order} t={orderT} />
                  </div>
                  <div className="mgr-md-order-column">
                    <OrderCustomerRequestDetails order={detail.order} t={orderT} />
                  </div>
                </div>
                <OrderAttachmentsCard order={detail.order} t={orderT} />
              </div>
            ) : (
              <CardComponent>
                <MgrEmptyState title={t.loadError} />
              </CardComponent>
            )
          ) : null}

          {activeTab === 'resources' ? (
            <MissionCrewCard
              rows={rows}
              note={note}
              staff={staff}
              deviceCode={deviceCode}
              deviceLabel={deviceLabel}
              permitStatus={mission.flightPermitStatus ?? 'NOT_REQUESTED'}
              permitNote={mission.flightPermitNote}
              missionId={mission.id}
              canReplaceStaff={
                !['PLANNING', 'CANCELLED', 'FAILED'].includes(mission.status) &&
                staff.some(
                  (assignment) =>
                    assignment.responseStatus === 'REJECTED' &&
                    assignment.isCurrent !== false,
                )
              }
            />
          ) : null}

          {activeTab === 'checks' ? (
            <ChecksTab
              preflight={preflight}
              postcheck={postcheck}
              missionStatus={mission.status}
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
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
