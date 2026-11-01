import { MissionSatelliteMap } from './MissionSatelliteMap'
import { formatNumber } from '../../../components/common/missionDetailHelpers'
import { waypointReasonLabel } from './MissionRouteMap'
import { MissionResultReviewCard } from '../../../components/common/MissionResultReviewCard'
import { ChecklistEmptyNote } from './ChecklistEmptyNote'
import { MonitoringChecklistSection } from '../../../../mission/components/MonitoringChecklistSection'
import { MissionUploadedMedia } from '../../../../media/components/MissionUploadedMedia'
import { staffMissionMediaReader } from '../../../api/missionMediaReader'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type {
  MissionResponse,
  PlanWaypointResponse,
  MissionPlanResponse,
} from '../../../types/missions'
import type { DetailData } from '../../../components/common/missionDetailTypes'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { MissionChecklistResponse } from '../../../../mission/types/checklistExecution'
import type { RefObject } from 'react'
import type { MissionDetailTab } from '../missionDetailTypes'

export function ActiveMissionOverview({
  activeTab,
  onTabChange,
  mission,
  waypoints,
  plan,
  detail,
  checklist,
  loading,
  refreshDetail,
  mediaLibrary,
  missionId,
}: {
  activeTab: MissionDetailTab
  onTabChange: (tab: MissionDetailTab) => void
  mission: MissionResponse
  waypoints: PlanWaypointResponse[]
  plan: MissionPlanResponse | null
  detail: DetailData
  checklist: UseApiQueryState<MissionChecklistResponse>
  loading: boolean
  refreshDetail: () => void
  mediaLibrary: RefObject<HTMLElement | null>
  missionId: string
}) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  return (
    <div className={`odm-md-sections is-${activeTab}`}>
      <section
        className="odm-or-card odm-rm-card odm-md-panel is-route"
        hidden={activeTab !== 'route'}
      >
        <div className="odm-rm-stage">
          <MissionSatelliteMap
            missionId={mission.id}
            latitude={mission.latitude}
            longitude={mission.longitude}
            visible={activeTab === 'route'}
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

      <div
        className="odm-md-panel is-checklist"
        hidden={activeTab !== 'checklist'}
      >
        <MonitoringChecklistSection
          hideImplementationHints
          missionId={mission.id}
          data={
            checklist.data?.missionId === missionId ? checklist.data : undefined
          }
          loading={checklist.loading}
          error={
            checklist.error ? new Error(t.extra.checklistLoadError) : undefined
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
            (checklist.data?.executions?.length ?? 0) === 0
          }
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
    </div>
  )
}
