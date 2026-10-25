import type { NextStep } from '../missionDetailTypes'

export function MissionNextStep({ nextStep }: { nextStep: NextStep }) {
  return (
    <div className={`odm-md-next is-${nextStep.tone}`} role="status">
      <strong>{nextStep.title}</strong>
      <span>{nextStep.detail}</span>
    </div>
  )
}
