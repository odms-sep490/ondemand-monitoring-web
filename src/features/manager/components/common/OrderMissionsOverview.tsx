import type { ReactNode } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { orderMissionsOverviewMessages } from './OrderMissionsOverview.messages'
import { assignmentReadiness } from '../../lib/assignmentReadiness'
import type { MissionStaffRole } from '../../../mission/types/mission'
import { STAFF_ROLE_LABELS } from './missionDetailHelpers'
import { OrderIcon } from './OrderIcon'
import { OrderWorkflowStepper } from './OrderWorkflowStepper'
import { planningSchedule } from './planningSchedule'
import { FlightPermitCard } from './FlightPermitCard'
import type { MissionResponse } from '../../types/missions'
import { Button } from '../../../../shared/components/ui'
import { OrderDetailsDrawer } from './OrderDetailsDrawer'
import type { OrderDetail } from '../../types/orders'

const ROLES: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]

type OverviewMission = MissionResponse

/** Step 8: read-only summary of every Mission of the Order so the manager can double-check. */
export function OrderMissionsOverview({
  missions,
  scopeLabels,
  loading,
  onDone,
  onReload,
  onAssignMore,
  doneLabel,
  order,
  embedded = false,
  mode = 'preparation',
}: {
  missions: OverviewMission[]
  scopeLabels: Record<string, string | undefined>
  loading: boolean
  onDone: () => void
  onReload: () => void
  onAssignMore?: (missionId: string) => void
  doneLabel: ReactNode
  order?: OrderDetail
  /** The outer page already renders the heading and stepper. */
  embedded?: boolean
  mode?: 'preparation' | 'permit'
}) {
  const { t } = useI18n(orderMissionsOverviewMessages)
  const effective = missions.filter((mission) => mission.status !== 'CANCELLED')
  const completeCount = effective.filter(
    (mission) => assignmentReadiness(mission).complete,
  ).length
  const allReady = effective.length > 0 && completeCount === effective.length

  return (
    <div className="odm-or">
      {!embedded && (
        <>
          <div className="odm-or-pagehead odm-or-pagehead-row">
            <div>
              <h1 className="odm-or-title">{t.title}</h1>
              <p className="odm-or-subtitle">{t.subtitle}</p>
            </div>
            <div className="odm-or-order-page-actions">
              {order ? <OrderDetailsDrawer order={order} /> : null}
              <Button
                type="button"
                disabled={loading}
                onClick={onReload}
              >
                {t.reload}
              </Button>
            </div>
          </div>
          <OrderWorkflowStepper currentStep={mode === 'permit' ? 9 : 8} />
        </>
      )}
      {mode === 'preparation' ? (
        <section className="odm-or-card" aria-label={t.title}>
        <header className="odm-or-card-head">
          <span className="odm-or-card-title">
            {t.completeCount(completeCount, effective.length)}
          </span>
          <span
            className={`odm-or-pill ${allReady ? 'odm-or-pill-green' : 'odm-or-pill-amber'}`}
            role="status"
          >
            {allReady ? t.ready : t.missingAssignment}
          </span>
        </header>
        <div className="odm-or-card-body">
          {loading && <p role="status">{t.loading}</p>}
          <div className="odm-or-overview-grid">
            {missions.map((mission) => {
              const readiness = assignmentReadiness(mission)
              const cancelled = mission.status === 'CANCELLED'
              const device =
                mission.deviceCode ||
                mission.droneCode ||
                mission.deviceName ||
                (mission.deviceId || mission.droneId
                  ? t.assignedDevice
                  : null)
              return (
                <article
                  key={mission.id}
                  className={`odm-or-overview-card${
                    cancelled ? ' is-cancelled' : ''
                  }`}
                >
                  <header>
                    <strong>{mission.missionCode}</strong>
                    <span
                      className={`odm-or-pill ${
                        readiness.complete
                          ? 'odm-or-pill-green'
                          : 'odm-or-pill-amber'
                      }`}
                    >
                      {cancelled
                        ? t.cancelled
                        : readiness.complete
                          ? t.assigned
                          : (readiness.label ?? mission.status)}
                    </span>
                  </header>
                  {scopeLabels[mission.id] ? (
                    <p className="odm-or-muted">{scopeLabels[mission.id]}</p>
                  ) : null}
                  <dl className="odm-or-overview-list">
                    <div>
                      <dt>
                        <OrderIcon name="calendar" size={16} />
                        {t.schedule}
                      </dt>
                      <dd>
                        {planningSchedule(
                          mission.scheduledStartAt,
                          mission.scheduledEndAt,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <OrderIcon name="drone" size={16} />
                        {t.device}
                      </dt>
                      <dd>{device ?? '—'}</dd>
                    </div>
                    {ROLES.map((role) => {
                      const names = [
                        ...new Set(
                          (mission.staffAssignments ?? [])
                            .filter(
                              (person) =>
                                person.assignedRole === role &&
                                person.responseStatus !== 'REJECTED',
                            )
                            .map(
                              (person) =>
                                person.staffName ||
                                person.staffEmail ||
                                person.staffId,
                            ),
                        ),
                      ]
                      return (
                        <div key={role}>
                          <dt>
                            <OrderIcon name="user" size={16} />
                            {STAFF_ROLE_LABELS[role]}
                          </dt>
                          <dd>{names.join(', ') || '—'}</dd>
                        </div>
                      )
                    })}
                  </dl>
                  {!cancelled && !readiness.complete && onAssignMore ? (
                    <Button
                      type="button"
                      onClick={() => onAssignMore(mission.id)}
                    >
                      {t.assignMore}
                    </Button>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
        </section>
      ) : null}
      {mode === 'permit'
        ? missions
            .filter(
              (mission) =>
                assignmentReadiness(mission).complete &&
                mission.status !== 'CANCELLED',
            )
            .map((mission) => (
              <FlightPermitCard
                key={mission.id}
                mission={mission}
                onChanged={onReload}
              />
            ))
        : null}
      <div className="odm-or-actionbar">
        <div className="odm-or-actionbar-hint">
          {mode === 'permit'
            ? t.hintPermit
            : allReady
              ? t.hintAllReady
              : t.hintMissing}
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={onDone}
        >
          {doneLabel}
        </Button>
      </div>
    </div>
  )
}
