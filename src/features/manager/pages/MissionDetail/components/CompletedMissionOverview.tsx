import { MissionResultReviewCard } from '../../../components/common/MissionResultReviewCard'
import { MissionUploadedMedia } from '../../../../media/components/MissionUploadedMedia'
import { staffMissionMediaReader } from '../../../api/missionMediaReader'
import { ChecklistEmptyNote } from './ChecklistEmptyNote'
import { MonitoringChecklistSection } from '../../../../mission/components/MonitoringChecklistSection'
import { MissionSatelliteMap } from './MissionSatelliteMap'
import { formatNumber } from '../../../components/common/missionDetailHelpers'
import { waypointReasonLabel } from './MissionRouteMap'
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
  waypoints,
  plan,
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
          mediaCount={detail.media.length}
          locale={locale}
          onReviewed={refreshDetail}
          onViewMedia={() => onTabChange('media')}
        />
      </div>

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
            latitude={mission.latitude}
            longitude={mission.longitude}
          />
        </div>
        <div className="odm-rm-side">
          <h3>{t.map.title}</h3>
          <dl className="odm-or-kv">
            <div>
              <dt>{t.map.waypoint}</dt>
              <dd>{waypoints.length}</dd>
            </div>
            <div>
              <dt>{t.map.distance}</dt>
              <dd>{formatNumber(plan?.plannedDistanceM, ' m')}</dd>
            </div>
            <div>
              <dt>{t.map.altitude}</dt>
              <dd>{formatNumber(plan?.maxPlannedAltitudeM, ' m')}</dd>
            </div>
          </dl>
          <ul className="odm-rm-key">
            <li>
              <i className="is-home" />
              {t.map.home}
            </li>
            <li>
              <i className="is-line" />
              {t.map.route}
            </li>
            <li>
              <i className="is-wp" />
              {t.map.waypoint}
            </li>
            <li>
              <i className="is-target" />
              {t.map.target}
            </li>
          </ul>
          {waypoints.length > 0 ? (
            <ul className="odm-rm-wps mgr-scroll-list">
              {waypoints.map((point, index) => (
                <li key={point.id}>
                  <b>
                    {index === 0
                      ? 'H'
                      : index === waypoints.length - 1
                        ? 'T'
                        : point.sequence}
                  </b>
                  <strong>{waypointReasonLabel(point.reason)}</strong>
                  <span>{formatNumber(point.altitudeM, ' m')}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  )
}
