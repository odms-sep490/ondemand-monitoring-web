import { useEffect, useState, type ReactNode } from 'react'
import './FlightCockpit.css'
import { type CockpitTelemetry, type CockpitCommand } from './cockpitTypes'
import { copy } from './cockpitCopy'
import { useFlightClock, useCockpitLayout } from './cockpitHooks'
import { CockpitHeader } from './CockpitHeader'
import { CockpitCameraPanel } from './CockpitCameraPanel'
import { CockpitMapPanel } from './CockpitMapPanel'
import { CockpitTelemetryPanel } from './CockpitTelemetryPanel'
import { CockpitControlsPanel } from './CockpitControlsPanel'

type Props = {
  language: 'vi' | 'en'
  missionLabel: string
  roleLabel: string
  liveLabel: string
  online: boolean
  waitingGpsLabel: string
  statusMessage: string
  telemetry: CockpitTelemetry
  camera: ReactNode
  map: ReactNode
  overlay?: ReactNode
  busy: boolean
  canFly: boolean
  canTerminate?: boolean
  canFlyToTarget: boolean
  /** @deprecated reference-photo button was removed; the Photo control captures instead */
  referenceBusy?: boolean
  onCommand: (command: CockpitCommand) => void
  onReview: () => void
  onStartFlight?: () => void
  canStartFlight?: boolean
  startingFlight?: boolean
  onFinishFlight?: () => void
  finishingFlight?: boolean
  onReferenceCapture?: () => void
}

export function FlightCockpit(props: Props) {
  const {
    language,
    missionLabel,
    roleLabel,
    liveLabel,
    online,
    waitingGpsLabel,
    statusMessage,
    telemetry: tm,
    camera,
    map,
    overlay,
    busy,
    canFly,
    canFlyToTarget,
    canTerminate = false,
    onCommand,
    onReview,
    onStartFlight,
    canStartFlight = false,
    startingFlight = false,
    onFinishFlight,
    finishingFlight,
  } = props
  const c = copy[language]
  const clock = useFlightClock(tm.inAir)
  const [confirmStop, setConfirmStop] = useState(false)
  const [layout, setLayout] = useCockpitLayout()
  const [paramsOpen, setParamsOpen] = useState(true)
  const [controlOpen, setControlOpen] = useState(true)
  useEffect(() => {
    if (!confirmStop) return
    const timer = window.setTimeout(() => setConfirmStop(false), 3000)
    return () => window.clearTimeout(timer)
  }, [confirmStop])

  const battery = tm.batteryPercent
  const batteryTone =
    battery === null
      ? 'ok'
      : battery <= 20
        ? 'low'
        : battery <= 40
          ? 'mid'
          : 'ok'
  const hasGps = tm.latitude !== null && tm.longitude !== null
  const gpsText = hasGps
    ? `${tm.latitude!.toFixed(6)}, ${tm.longitude!.toFixed(6)}`
    : waitingGpsLabel

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen?.()
    else void document.documentElement.requestFullscreen?.()
  }

  const controls: Array<{
    cmd: CockpitCommand
    icon: string
    label: string
    sub: string
    tone?: string
    enabled: boolean
  }> = [
    {
      cmd: 'takeoff',
      icon: 'takeoff',
      label: c.takeoff,
      sub: c.takeoffSub,
      enabled: canFly,
    },
    {
      cmd: 'gps_target_start',
      icon: 'fly',
      label: c.fly,
      sub: c.flySub,
      tone: 'primary',
      enabled: canFly && canFlyToTarget,
    },
    {
      cmd: 'stop',
      icon: 'pause',
      label: c.pause,
      sub: c.pauseSub,
      enabled: canFly || canTerminate,
    },
    {
      cmd: 'photo',
      icon: 'photo',
      label: c.photo,
      sub: c.photoSub,
      enabled: canFly,
    },
    {
      cmd: 'return_to_base',
      icon: 'rtl',
      label: c.rtl,
      sub: c.rtlSub,
      enabled: canFly || canTerminate,
    },
    {
      cmd: 'land',
      icon: 'land',
      label: c.land,
      sub: c.landSub,
      tone: 'success',
      enabled: canFly || canTerminate,
    },
  ]

  return (
    <div className="fc-root">
      <CockpitHeader
        c={c}
        missionLabel={missionLabel}
        roleLabel={roleLabel}
        online={online}
        liveLabel={liveLabel}
        clock={clock}
        batteryTone={batteryTone}
        battery={battery}
        gpsText={gpsText}
        onStartFlight={onStartFlight}
        canStartFlight={canStartFlight}
        language={language}
        busy={busy}
        startingFlight={startingFlight}
        layout={layout}
        setLayout={setLayout}
        onReview={onReview}
        toggleFullscreen={toggleFullscreen}
      />

      <main className={`fc-body is-layout-${layout}`}>
        <CockpitCameraPanel
          c={c}
          batteryTone={batteryTone}
          battery={battery}
          setLayout={setLayout}
          layout={layout}
          camera={camera}
        />

        <CockpitMapPanel
          c={c}
          statusMessage={statusMessage}
          setLayout={setLayout}
          layout={layout}
          map={map}
          missionLabel={missionLabel}
        />

        <aside className="fc-side">
          <CockpitTelemetryPanel
            c={c}
            tm={tm}
            paramsOpen={paramsOpen}
            setParamsOpen={setParamsOpen}
            batteryTone={batteryTone}
            battery={battery}
            hasGps={hasGps}
          />

          <CockpitControlsPanel
            c={c}
            controlOpen={controlOpen}
            setControlOpen={setControlOpen}
            controls={controls}
            busy={busy}
            onCommand={onCommand}
            onFinishFlight={onFinishFlight}
            finishingFlight={finishingFlight}
            canFly={canFly}
            canTerminate={canTerminate}
            language={language}
            confirmStop={confirmStop}
            setConfirmStop={setConfirmStop}
          />
        </aside>
      </main>
      {overlay}
    </div>
  )
}
