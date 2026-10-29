import { copy } from './cockpitCopy'
import { Ico } from './CockpitIcon'
import type { Dispatch, SetStateAction } from 'react'
import type { CockpitCommand } from './cockpitTypes'

export function CockpitControlsPanel({
  c,
  controlOpen,
  setControlOpen,
  controls,
  busy,
  onCommand,
  onFinishFlight,
  finishingFlight,
  canFly,
  canTerminate,
  confirmStop,
  setConfirmStop,
}: {
  c: (typeof copy)['vi' | 'en']
  controlOpen: boolean
  setControlOpen: Dispatch<SetStateAction<boolean>>
  controls: {
    cmd: CockpitCommand
    icon: string
    label: string
    sub: string
    tone?: string | undefined
    enabled: boolean
  }[]
  busy: boolean
  onCommand: (command: CockpitCommand) => void
  onFinishFlight: (() => void) | undefined
  finishingFlight: boolean | undefined
  canFly: boolean
  canTerminate: boolean
  language: 'vi' | 'en'
  confirmStop: boolean
  setConfirmStop: Dispatch<SetStateAction<boolean>>
}) {
  return (
    <section className="fc-panel">
      <header className="fc-panel__head">
        <span className="fc-panel__title is-bar">{c.control}</span>
        <button
          type="button"
          className={`fc-collapse${controlOpen ? '' : ' is-closed'}`}
          aria-expanded={controlOpen}
          aria-label={controlOpen ? c.collapse : c.expandPanel}
          title={controlOpen ? c.collapse : c.expandPanel}
          onClick={() => setControlOpen((open) => !open)}
        >
          <Ico name="chevron" size={18} />
        </button>
      </header>
      {controlOpen ? (
        <>
          <div className="fc-controls">
            {controls.map((item) => (
              <button
                key={item.cmd}
                type="button"
                className={`fc-ctl${item.tone ? ` is-${item.tone}` : ''}`}
                disabled={busy || !item.enabled}
                onClick={() => onCommand(item.cmd)}
              >
                <Ico name={item.icon} size={20} />
                <strong>{item.label}</strong>
                <small>{item.sub}</small>
              </button>
            ))}
            {onFinishFlight ? (
              <button
                type="button"
                className="fc-ctl fc-finish is-success"
                disabled={busy || finishingFlight || (!canFly && !canTerminate)}
                onClick={onFinishFlight}
              >
                <Ico name="land" size={20} />
                <strong>{finishingFlight ? c.updating : c.finishFlight}</strong>
                <small>{c.finishFlightSub}</small>
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className={`fc-emergency${confirmStop ? ' is-armed' : ''}`}
            disabled={busy || (!canFly && !canTerminate)}
            onClick={() => {
              if (!confirmStop) {
                setConfirmStop(true)
                return
              }
              setConfirmStop(false)
              onCommand('emergency_stop')
            }}
          >
            <Ico name="stop" size={30} />
            <span>
              <strong>{c.emergency}</strong>
              <small>{confirmStop ? c.emergencyConfirm : c.emergencySub}</small>
            </span>
          </button>
        </>
      ) : null}
    </section>
  )
}
