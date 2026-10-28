import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { OrderIcon } from './OrderIcon'
import {
  MISSION_PLANNING_STAGES,
  ORDER_STAGES,
  missionStageState,
  orderStageState,
  type MissionProgress,
  type MissionStage,
  type OrderProgress,
  type OrderStage,
  type StageState,
} from './workflowModel'
import { workflowStepperMessages } from './WorkflowStepper.messages'
import '../../manager.css'
import { Button } from '../../../../shared/components/ui'

export type WorkflowOrderLayer = {
  progress: OrderProgress
  /** Business status shown next to the layer title (not the step number). */
  statusLabel?: string
  /** Completed stage currently opened for read-only review. */
  viewing?: OrderStage | null
  /** Stages that can be opened; completed stages are selectable by default. */
  onSelect?: (stage: OrderStage) => void
  selectable?: (stage: OrderStage, state: StageState) => boolean
}

export type WorkflowMissionLayer = {
  progress: MissionProgress | null
  index?: number
  total?: number
  code?: string
  statusLabel?: string
  detail?: ReactNode
  onPrev?: () => void
  onNext?: () => void
  onSelect?: (stage: MissionStage) => void
  selectable?: (stage: MissionStage, state: StageState) => boolean
  viewing?: MissionStage | null
}

function StateIcon({ state, number }: { state: StageState; number: number }) {
  if (state === 'done') return <OrderIcon name="check" size={15} />
  if (state === 'waiting') return <OrderIcon name="clock" size={15} />
  if (state === 'blocked') return <OrderIcon name="lock" size={14} />
  return <>{number}</>
}

/**
 * Two-level workflow header. The Order level is one row; the Mission level is a
 * separate row with its own "Mission x / y" context. They are never joined into
 * a single numbered line.
 */
export function WorkflowStepper({
  order,
  mission,
  compactOrder = false,
}: {
  order: WorkflowOrderLayer
  mission?: WorkflowMissionLayer
  /** When the Order phase is complete, show it as one slim line instead of five finished steps. */
  compactOrder?: boolean
}) {
  const { t } = useI18n(workflowStepperMessages)
  const { progress } = order
  const orderNote = progress.terminal
    ? progress.terminal === 'rejected'
      ? t.rejected
      : t.cancelledOrder
    : progress.waiting
      ? t.waitingDeposit
      : progress.current === 'complete'
        ? t.orderComplete
        : null
  const orderTone = progress.terminal
    ? 'is-danger'
    : progress.waiting
      ? 'is-waiting'
      : progress.current === 'complete'
        ? 'is-done'
        : 'is-current'

  const collapseOrder =
    compactOrder && progress.current === 'complete' && !progress.terminal
  return (
    <nav className="odm-or-card odm-wf" aria-label={t.ariaLabel}>
      <section
        className={`odm-wf-layer${collapseOrder ? ' is-collapsed' : ''}`}
        aria-label={t.orderLayer}
      >
        <header className="odm-wf-head">
          <span className="odm-wf-eyebrow">{t.orderLayer}</span>
          {order.statusLabel || orderNote ? (
            <span className={`odm-wf-chip ${orderTone}`}>
              {progress.waiting ? <OrderIcon name="clock" size={13} /> : null}
              {order.statusLabel ?? orderNote}
            </span>
          ) : null}
        </header>
        <ol className="odm-wf-steps" hidden={collapseOrder}>
          {ORDER_STAGES.map((stage, index) => {
            const state = orderStageState(stage, progress)
            const copy = t.orderStages[stage]
            const viewing = order.viewing === stage
            const clickable =
              Boolean(order.onSelect) &&
              (order.selectable
                ? order.selectable(stage, state)
                : state === 'done')
            const body = (
              <>
                <span className="odm-wf-dot">
                  <StateIcon state={state} number={index + 1} />
                </span>
                <span className="odm-wf-text">
                  <strong>{copy.label}</strong>
                  <small>
                    {state === 'waiting'
                      ? t.waitingDeposit
                      : state === 'done'
                        ? t.state.doneStatic
                        : copy.hint}
                  </small>
                </span>
              </>
            )
            return (
              <li
                key={stage}
                className={`odm-wf-step is-${state}${viewing ? ' is-viewing' : ''}`}
              >
                {clickable ? (
                  <button
                    type="button"
                    className="odm-wf-btn"
                    title={state === 'done' ? t.state.done : copy.label}
                    aria-current={
                      viewing || state === 'current' ? 'step' : undefined
                    }
                    onClick={() => order.onSelect?.(stage)}
                  >
                    {body}
                  </button>
                ) : (
                  <div
                    className="odm-wf-btn is-static"
                    title={t.state[state]}
                    aria-current={
                      state === 'current' || state === 'waiting'
                        ? 'step'
                        : undefined
                    }
                  >
                    {body}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        {progress.waiting ? (
          <p className="odm-wf-note is-waiting" role="status">
            {t.waitingDepositNote}
          </p>
        ) : null}
      </section>

      {mission ? (
        <section
          className="odm-wf-layer is-mission"
          aria-label={t.missionLayer}
        >
          <header className="odm-wf-head">
            <span className="odm-wf-eyebrow">{t.missionLayer}</span>
            {mission.index != null && mission.total != null ? (
              <strong className="odm-wf-mission-of">
                {t.missionOf(mission.index, mission.total)}
              </strong>
            ) : null}
            {mission.code ? (
              <code className="odm-wf-code">{mission.code}</code>
            ) : null}
            {mission.statusLabel ? (
              <span className="odm-wf-chip is-current">
                {mission.statusLabel}
              </span>
            ) : null}
            {mission.onPrev || mission.onNext ? (
              <span className="odm-wf-pager">
                <Button
                  type="button"
                  disabled={!mission.onPrev}
                  onClick={mission.onPrev}
                >
                  <ArrowLeftOutlined aria-hidden="true" /> {t.missionPrev}
                </Button>
                <Button
                  type="button"
                  disabled={!mission.onNext}
                  onClick={mission.onNext}
                >
                  {t.missionNext} <ArrowRightOutlined aria-hidden="true" />
                </Button>
              </span>
            ) : null}
          </header>
          <ol className="odm-wf-steps">
            {MISSION_PLANNING_STAGES.map((stage, index) => {
              const state: StageState = mission.progress
                ? missionStageState(stage, mission.progress)
                : 'upcoming'
              const copy = t.missionStages[stage]
              const clickable = Boolean(
                mission.onSelect &&
                  (mission.selectable
                    ? mission.selectable(stage, state)
                    : state === 'current' || state === 'done'),
              )
              const body = (
                <>
                  <span className="odm-wf-dot">
                    <StateIcon state={state} number={index + 1} />
                  </span>
                  <span className="odm-wf-text">
                    <strong>{copy.label}</strong>
                    <small>
                      {state === 'done' ? t.state.doneStatic : copy.hint}
                    </small>
                  </span>
                </>
              )
              const isViewing = mission.viewing === stage
              return (
                <li
                  key={stage}
                  className={`odm-wf-step is-${state}${isViewing ? ' is-viewing' : ''}`}
                >
                  {clickable ? (
                    <button
                      type="button"
                      className="odm-wf-btn"
                      title={copy.label}
                      aria-current={isViewing || state === 'current' ? 'step' : undefined}
                      onClick={() => mission.onSelect?.(stage)}
                    >
                      {body}
                    </button>
                  ) : (
                    <div
                      className="odm-wf-btn is-static"
                      title={t.state[state]}
                      aria-current={state === 'current' ? 'step' : undefined}
                    >
                      {body}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
          {mission.detail}
        </section>
      ) : null}
    </nav>
  )
}
