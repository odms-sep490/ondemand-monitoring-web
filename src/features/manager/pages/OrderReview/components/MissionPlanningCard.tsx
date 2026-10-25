import type { ReactNode } from 'react'
import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import {
  missionStatusLabel,
  missionStatusTone,
} from '../../../../../shared/lib/statusTone'
import { managerHref } from '../../../routes'
import type { MissionResponse } from '../../../types/missions'
import type { ExecutionPlan } from '../../../types/planning'
import { STAFF_ROLE_LABELS } from '../../../components/common/missionDetailHelpers'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { planningSchedule } from '../../../components/common/planningSchedule'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import { useLanguage } from '../../../../../shared/i18n'
import { localizePlanningScopeLabel } from './planningScopeLabel'

export function MissionPlanningCard({
  mission,
  scope,
  missions,
  children,
}: {
  mission: MissionResponse
  scope?: ExecutionPlan['missions'][number]
  missions: MissionResponse[]
  children: ReactNode
}) {
  const { lang } = useLanguage()
  const original = missions.find((m) => m.id === mission.replacesMissionId)
  const replacements = missions.filter(
    (m) => m.replacesMissionId === mission.id,
  )
  return (
    <article
      className="odm-planning-mission"
      aria-label={mission.missionCode || 'Mission'}
    >
      <header className="odm-mission-identity">
        <h3>
          <a
            href={managerHref({
              screen: 'missionDetail',
              missionId: mission.id,
            })}
          >
            {mission.missionCode || 'Mission'}
          </a>
        </h3>
        <StatusBadge
          tone={toUiTone(missionStatusTone[mission.status] ?? 'gray')}
        >
          {missionStopLabel(mission) ??
            missionStatusLabel[mission.status] ??
            'Chưa xác định'}
        </StatusBadge>
        {scope?.finalizedPlanRevision != null && (
          <span className="odm-mission-meta">
            Đã chốt tại phiên bản {scope.finalizedPlanRevision}
          </span>
        )}
      </header>
      <div className="odm-mission-scope">
        <p>
          {scope?.scopeLabel
            ? localizePlanningScopeLabel(scope.scopeLabel, lang)
            : mission.orderTitle || 'Phạm vi theo đơn hàng'}
        </p>
        <span>
          <OrderIcon name="calendar" size={15} />
          {planningSchedule(mission.scheduledStartAt, mission.scheduledEndAt)}
        </span>
      </div>
      <div className="odm-mission-resources">
        <section aria-label="Thiết bị" className="odm-mission-resource">
          <h4>
            <OrderIcon name="drone" size={16} />
            Thiết bị
          </h4>
          <strong>
            {mission.deviceName || mission.deviceCode || 'Chưa phân công'}
          </strong>
          {mission.deviceName && mission.deviceCode && (
            <span className="odm-mission-meta">{mission.deviceCode}</span>
          )}
        </section>
        <section aria-label="Nhân sự" className="odm-mission-resource">
          <h4>
            <OrderIcon name="users" size={16} />
            Nhân sự
          </h4>
          {mission.staffAssignments?.length ? (
            <ul className="odm-mission-crew">
              {mission.staffAssignments.map((person, index) => (
                <li
                  key={
                    person.id ||
                    `${person.staffId}-${person.assignedRole}-${index}`
                  }
                >
                  <span>
                    {STAFF_ROLE_LABELS[person.assignedRole] ?? 'Nhân sự'}
                  </span>
                  <strong>{person.staffName || 'Chưa có tên'}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="odm-mission-meta">Chưa phân công</p>
          )}
        </section>
      </div>
      {children}
      {(mission.replacesMissionId || replacements.length > 0) && (
        <footer className="odm-mission-history" aria-label="Lịch sử Mission">
          {mission.replacesMissionId && (
            <p>
              Thay thế cho{' '}
              <a
                href={managerHref({
                  screen: 'missionDetail',
                  missionId: mission.replacesMissionId,
                })}
              >
                {original?.missionCode || 'Mission trước'}
              </a>
            </p>
          )}
          {replacements.map((replacement) => (
            <p key={replacement.id}>
              Được thay thế bởi{' '}
              <a
                href={managerHref({
                  screen: 'missionDetail',
                  missionId: replacement.id,
                })}
              >
                {replacement.missionCode || 'Mission thay thế'}
              </a>
            </p>
          ))}
        </footer>
      )}
    </article>
  )
}
