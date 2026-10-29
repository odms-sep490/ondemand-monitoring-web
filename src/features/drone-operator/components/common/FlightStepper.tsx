import { Steps } from 'antd'
import { useEffect, useRef, type ReactNode } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { flightStepperMessages } from './FlightStepper.messages'

/** Stepper header shared by the flight-prep screens (OPR-04/05/06). `active` is the current step index (0-based). */
export function FlightStepper({ active }: { active: number }) {
  const { t } = useI18n(flightStepperMessages)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current
      ?.querySelector('.ant-steps-item-process')
      ?.scrollIntoView?.({ inline: 'center', block: 'nearest' })
  }, [active])
  return (
    <div ref={ref} className="stf-stepper-wrap">
      <Steps
        className="stf-stepper"
        size="small"
        responsive={false}
        current={active}
        items={t.steps.map((step, i) => ({
          key: step.key,
          title: i === active ? step.label : undefined,
        }))}
      />
    </div>
  )
}

/** Sub-header bar used by OPR-04/05/06: title, mono mission id, centered stepper, right-side slot. */
export function FlightStepHeader({
  title,
  missionId,
  active,
  right,
  idTitle,
}: {
  title: string
  missionId: string
  active: number
  right?: ReactNode
  /** Full identifier shown as a tooltip when `missionId` is a short code. */
  idTitle?: string
}) {
  return (
    <header className="stf-stephead">
      <div className="stf-stephead-title">
        <h1>{title}</h1>
        <div className="stf-mono stf-muted" title={idTitle}>
          {missionId}
        </div>
      </div>
      <FlightStepper active={active} />
      {right ? <div className="stf-stephead-right">{right}</div> : null}
    </header>
  )
}
