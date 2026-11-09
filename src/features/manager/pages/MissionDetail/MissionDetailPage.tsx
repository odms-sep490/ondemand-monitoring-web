// MNG-08: Mission detail & result page (opened from the mission list).
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { MissionKpis } from './components/MissionKpis'
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
  const [tab, setTab] = useState<MissionDetailTab>('result')
  const mediaLibrary = useRef<HTMLElement>(null)
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

      {nextStep ? <MissionNextStep nextStep={nextStep} /> : null}

      <MissionKpis kpis={kpis} />

      <div className="mgr-md-workbench">
        <MissionDetailTabs
          tabs={tabs}
          activeTab={activeTab}
          setTab={setTab}
          resourceUnreadCount={resourceUnreadCount}
        />

        <div
          className="mgr-md-tabpanel"
          role="tabpanel"
          id="mission-detail-panel"
          aria-labelledby={`mission-detail-tab-${activeTab}`}
          tabIndex={0}
        >
          {(
            ['result', 'media', 'checklist', 'route'] as MissionDetailTab[]
          ).includes(activeTab) ? (
            <OverviewTab
              activeTab={activeTab}
              onTabChange={setTab}
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
          ) : null}

          {activeTab === 'order' ? (
            detail.order ? (
              <div className="odm-or-order-review-stack">
                <OrderServiceInfo order={detail.order} t={orderT} />
                <OrderCustomerRequestDetails order={detail.order} t={orderT} />
                <OrderCustomerCard order={detail.order} t={orderT} />
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
            <ChecksTab preflight={preflight} postcheck={postcheck} />
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
