import { useEffect, useState } from 'react'
import { MissionResultReviewCard } from '../../../components/common/MissionResultReviewCard'
import { MissionUploadedMedia } from '../../../../media/components/MissionUploadedMedia'
import { staffMissionMediaReader } from '../../../api/missionMediaReader'
import { ChecklistEmptyNote } from './ChecklistEmptyNote'
import { MonitoringChecklistSection } from '../../../../mission/components/MonitoringChecklistSection'
import { MissionSatelliteMap } from './MissionSatelliteMap'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type {
  MissionResponse,
  PlanWaypointResponse,
  MissionPlanResponse,
} from '../../../types/missions'
import type { DetailData } from '../../../components/common/missionDetailTypes'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type {
  MissionChecklistResponse,
  MissionChecklistExecution,
} from '../../../../mission/types/checklistExecution'
import type { RefObject } from 'react'
import type { MissionDetailTab } from '../missionDetailTypes'

export function CompletedMissionOverview({
  activeTab,
  onTabChange,
  mission,
  detail,
  checklist,
  loading,
  refreshDetail,
  mediaLibrary,
  isCompleted,
  resultApproved,
  checklistExecutions,
  compliantCount,
  missionId,
}: {
  activeTab: MissionDetailTab
  onTabChange: (tab: MissionDetailTab) => void
  mission: MissionResponse
  detail: DetailData
  checklist: UseApiQueryState<MissionChecklistResponse>
  loading: boolean
  refreshDetail: () => void
  mediaLibrary: RefObject<HTMLElement | null>
  isCompleted: true
  resultApproved: boolean
  checklistExecutions: MissionChecklistExecution[]
  compliantCount: number
  missionId: string
  waypoints: PlanWaypointResponse[]
  plan: MissionPlanResponse | null
}) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  const [mediaVisited, setMediaVisited] = useState(activeTab === 'media')
  useEffect(() => {
    if (activeTab === 'media') setMediaVisited(true)
  }, [activeTab])
  const mediaCount =
    detail.result?.mediaCount ??
    detail.result?.mediaFiles?.length ??
    detail.media.length
  return (
    <div className={`odm-md-sections is-${activeTab}`}>
      <div className="odm-md-panel is-result" hidden={activeTab !== 'result'}>
        <MissionResultReviewCard
          mission={mission}
          result={detail.result}
          checklist={checklist.data}
          checklistLoading={checklist.loading}
          checklistFailed={!!checklist.error}
          refreshing={loading}
          mediaCount={mediaCount}
          locale={locale}
          onReviewed={refreshDetail}
          onViewMedia={() => onTabChange('media')}
        />
      </div>

      {mediaVisited ? (
        <section
          ref={mediaLibrary}
          tabIndex={-1}
          className="odm-md-panel is-media"
          hidden={activeTab !== 'media'}
          aria-label={t.extra.mediaLibrary}
        >
          <MissionUploadedMedia
            missionId={mission.id}
            missionStatus={mission.status}
            reader={staffMissionMediaReader}
            reviewStatus={detail.result?.approvalStatus ?? null}
          />
        </section>
      ) : null}
      {isCompleted && resultApproved ? (
        <details
          className="odm-or-card odm-md-collapse odm-md-panel is-checklist"
          hidden={activeTab !== 'checklist'}
          open
        >
          <summary>
            <span className="odm-md-collapse-title">
              {t.checklistAcceptance}
            </span>
            <span className="odm-md-collapse-meta">
              {checklistExecutions.length > 0
                ? t.checklistCompliant(
                    compliantCount,
                    checklistExecutions.length,
                  )
                : t.checklistLoading}
            </span>
            <span className="odm-or-pill odm-or-pill-green">
              {t.checklistAccepted}
            </span>
          </summary>
          <MonitoringChecklistSection
            hideImplementationHints
            missionId={mission.id}
            data={
              checklist.data?.missionId === missionId
                ? checklist.data
                : undefined
            }
            loading={checklist.loading}
            error={
              checklist.error
                ? new Error(t.extra.checklistLoadError)
                : undefined
            }
            resultStatus={detail.result?.approvalStatus}
            resultNote={detail.result?.reviewNote}
            refresh={() => {
              checklist.reload()
              refreshDetail()
            }}
          />
          <ChecklistEmptyNote
            show={
              !checklist.loading &&
              !checklist.error &&
              checklistExecutions.length === 0
            }
          />
        </details>
      ) : (
        <div
          className="odm-md-panel is-checklist"
          hidden={activeTab !== 'checklist'}
        >
          <MonitoringChecklistSection
            hideImplementationHints
            missionId={mission.id}
            data={
              checklist.data?.missionId === missionId
                ? checklist.data
                : undefined
            }
            loading={checklist.loading}
            error={
              checklist.error
                ? new Error(t.extra.checklistLoadError)
                : undefined
            }
            resultStatus={detail.result?.approvalStatus}
            resultNote={detail.result?.reviewNote}
            refresh={() => {
              checklist.reload()
              refreshDetail()
            }}
          />
          <ChecklistEmptyNote
            show={
              !checklist.loading &&
              !checklist.error &&
              checklistExecutions.length === 0
            }
          />
        </div>
      )}
      <section
        className="odm-or-card odm-rm-card odm-md-panel is-route"
        hidden={activeTab !== 'route'}
      >
        <div className="odm-rm-stage">
          <MissionSatelliteMap
            missionId={mission.id}
            order={detail.order}
            latitude={mission.latitude}
            longitude={mission.longitude}
            radiusMeters={mission.radiusM}
            coverageArea={mission.coverageArea}
            visible={activeTab === 'route'}
          />
        </div>
        <div className="odm-rm-side">
          <h3>{t.map.title}</h3>
          {detail.order?.addressText && (
            <p className="odm-or-detail-note">{detail.order.addressText}</p>
          )}
        </div>
      </section>
    </div>
  )
}
