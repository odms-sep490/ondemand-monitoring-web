// MNG-08: Mission detail & result page (opened from the mission list).
import { useRef, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { checklistExecutionApi } from '../../../mission/api/checklistExecutionApi'
import { StateView } from '../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../shared/i18n'
import { OrderAttachmentsCard } from '../../components/common/OrderAttachmentsCard'
import { OrderChecklistCard } from './components/OrderChecklistCard'
import { OrderCustomerCard } from '../../components/common/OrderCustomerCard'
import { OrderCustomerRequestDetails } from '../../components/common/OrderCustomerRequestDetails'
import { OrderServiceInfo } from '../../components/common/OrderServiceInfo'
import { type DetailData } from '../../components/common/missionDetailTypes'
import { OrderIcon } from '../../components/common/OrderIcon'
import { managerHref } from '../../routes'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import { orderReviewPageMessages } from '../OrderReview/OrderReviewPage.messages'
import '../../manager.css'
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

export function MissionDetailPage({ missionId }: { missionId: string }) {
  return <MissionDetail key={missionId} missionId={missionId} />
}

function MissionDetail({ missionId }: { missionId: string }) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  const { t: orderT } = useI18n(orderReviewPageMessages)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [droneLookup, setDroneLookup] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const checklist = useApiQuery(
    (signal) =>
      checklistExecutionApi.getMissionChecklistExecutions(missionId, signal),
    [missionId, revision],
  )
  const refreshDetail = () => setRevision((value) => value + 1)
  const [tab, setTab] = useState<MissionDetailTab>('result')
  const mediaLibrary = useRef<HTMLElement>(null)

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
    <a className="odm-or-back" href={managerHref({ screen: 'missions' })}>
      <OrderIcon name="arrow-right" size={14} />
      {t.back}
    </a>
  )

  if (loading && (!detail || detail.mission?.id !== missionId)) {
    return (
      <div className="odm-or" aria-busy="true">
        {backLink}
        <span className="odm-sk" style={{ width: '100%', height: 320 }} />
      </div>
    )
  }

  const mission = detail?.mission
  if (error || !mission || !detail) {
    return (
      <div className="odm-or">
        {backLink}
        <section className="odm-or-card">
          <StateView
            state="error"
            title={t.loadError}
            error={error ?? undefined}
          />
        </section>
      </div>
    )
  }

  const {
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
    <div className="odm-or">
      {backLink}
      <MissionDetailHeader
        mission={mission}
        headline={headline}
        canSetup={canSetup}
      />

      {nextStep ? <MissionNextStep nextStep={nextStep} /> : null}

      <MissionKpis kpis={kpis} />

      <div className="odm-or-md-grid">
        <div className="odm-or-col">
          <MissionDetailTabs
            tabs={tabs}
            activeTab={activeTab}
            setTab={setTab}
          />

          {(['result', 'media', 'checklist', 'route'] as MissionDetailTab[]).includes(
            activeTab,
          ) ? (
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
              revision={revision}
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
                <OrderChecklistCard order={detail.order} t={orderT} />
                <OrderAttachmentsCard order={detail.order} t={orderT} />
              </div>
            ) : (
              <section className="odm-or-card">
                <div className="odm-or-card-body odm-or-empty">
                  {t.loadError}
                </div>
              </section>
            )
          ) : null}

          {activeTab === 'checks' ? (
            <ChecksTab preflight={preflight} postcheck={postcheck} />
          ) : null}
        </div>

        <MissionCrewCard
          rows={rows}
          note={note}
          staff={staff}
          accepted={accepted}
          deviceCode={deviceCode}
          deviceLabel={deviceLabel}
        />
      </div>
    </div>
  )
}
