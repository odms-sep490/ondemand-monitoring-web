import { useState, useEffect } from 'react'
import type {
  Mission,
  PreflightCheck,
  FlightToken,
  DeviceStatus,
} from '../types/mission'
import { missionApi } from '../api/missionApi'
import {
  MissionStatusBadge,
  DeviceStatusBadge,
} from '../components/MissionStatusBadge'
import { PreflightDiagnosticCard } from '../components/PreflightDiagnosticCard'
import { FlightTelemetryHUD } from '../components/FlightTelemetryHUD'
import { PostflightModal } from '../components/PostflightModal'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { LanguageToggle } from '../../../shared/components/LanguageToggle'
import { useI18n } from '../../../shared/i18n'
import { operatorDashboardPageMessages } from './OperatorDashboardPage.messages'

const STEP_BY_STATUS: Record<string, number> = {
  READY: 1,
  WAITING_OPERATOR_ACCEPTANCE: 1,
  SCHEDULED: 2,
  CONNECTED: 2,
  PREFLIGHT_CHECKING: 2,
  READY_TO_FLY: 2,
  FAILED_PREFLIGHT: 2,
  PENDING_APPROVAL: 2,
  IN_FLIGHT: 3,
  IN_PROGRESS: 3,
  RETURNING: 3,
  POSTFLIGHT_CHECKING: 4,
  COMPLETED: 4,
}

function formatNumber(value?: number | null, digits = 1) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—'
}

function formatMeters(value?: number | null) {
  return `${formatNumber(value)} m`
}

function formatSeconds(value?: number | null) {
  return `${formatNumber(value)} s`
}

function formatMah(value?: number | null) {
  return `${formatNumber(value)} mAh`
}

function formatPercent(value?: number | null) {
  return `${formatNumber(value, 2)}%`
}

function planFeasibilityMessage(status: string | undefined, lang: 'vi' | 'en') {
  if (lang === 'en') {
    if (status === 'INSUFFICIENT_BATTERY') {
      return 'Mission battery estimate is below the configured safety reserve.'
    }
    if (status === 'BATTERY_DATA_UNAVAILABLE') {
      return 'Current drone battery telemetry is unavailable; mission cannot be marked safe.'
    }
    return 'No safe route could be generated for this mission.'
  }
  if (status === 'INSUFFICIENT_BATTERY') {
    return 'Ước tính pin của nhiệm vụ thấp hơn mức dự trữ an toàn đã cấu hình.'
  }
  if (status === 'BATTERY_DATA_UNAVAILABLE') {
    return 'Không có dữ liệu pin drone hiện tại; không thể xác nhận nhiệm vụ an toàn.'
  }
  return 'Không thể tạo lộ trình an toàn cho nhiệm vụ này.'
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '12px',
        background: 'var(--color-surface)',
      }}
    >
      <div
        style={{
          fontSize: '0.68rem',
          color: 'var(--color-muted)',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div className="mono" style={{ marginTop: '4px', fontWeight: 800 }}>
        {value}
      </div>
    </div>
  )
}

export function OperatorDashboardPage() {
  const { t, lang } = useI18n(operatorDashboardPageMessages)
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>('AVAILABLE')
  const [preflightCheck, setPreflightCheck] = useState<PreflightCheck | null>(
    null,
  )
  const [flightToken, setFlightToken] = useState<FlightToken | null>(null)
  const [isGcsConnected, setIsGcsConnected] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPostflightOpen, setIsPostflightOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [newDeviceCode, setNewDeviceCode] = useState('DRONE-02')

  // Telemetry Mock Controls
  const [batteryLevel, setBatteryLevel] = useState(95)
  const [gpsSatellites, setGpsSatellites] = useState(12)

  // Fetch mission strictly from Backend API on mount
  useEffect(() => {
    setLoading(true)
    setError(null)
    missionApi
      .getMissionById('M-001')
      .then((fetched) => {
        setMission(fetched)
      })
      .catch((err) => {
        setError((err as Error).message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--color-background)',
          minHeight: '100vh',
          padding: '60px 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <p className="eyebrow">LOADING MISSION DATA FROM BACKEND API...</p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              margin: '20px 0',
            }}
          >
            <Icon
              name="clock"
              style={{ animation: 'spin 1s linear infinite' }}
            />
            <span>
              {t.loadingConnecting('http://localhost:8080/api/missions/M-001')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !mission) {
    return (
      <div
        style={{
          background: 'var(--color-background)',
          minHeight: '100vh',
          padding: '60px 0',
        }}
      >
        <div
          className="container"
          style={{ maxWidth: '600px', margin: '0 auto' }}
        >
          <div
            className="card"
            style={{
              padding: '32px',
              borderColor: '#fca5a5',
              background:
                'color-mix(in srgb, #991b1b 5%, var(--color-surface))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#b91c1c',
                marginBottom: '16px',
              }}
            >
              <Icon name="x" style={{ width: '28px', height: '28px' }} />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                {t.cannotConnect}
              </h2>
            </div>
            <p
              style={{
                margin: '0 0 20px',
                fontSize: '0.88rem',
                color: 'var(--color-foreground)',
                lineHeight: 1.6,
              }}
            >
              {t.errorPrefix} <strong>{error || t.missionNotFound}</strong>.{' '}
              {t.ensureServerPrefix} <code>http://localhost:8080</code>.
            </p>
            <Button
              variant="primary"
              icon="route"
              onClick={() => window.location.reload()}
            >
              {t.retry}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentStep = STEP_BY_STATUS[mission.status] ?? 1
  const plan = mission.plan
  const planIsFeasible = plan?.feasibilityStatus === 'FEASIBLE'
  const canEnterPreflight =
    (mission.status === 'SCHEDULED' ||
      mission.status === 'CONNECTED' ||
      mission.status === 'READY_TO_FLY') &&
    planIsFeasible

  // ---------------------------------------------------------------------------
  // Flow 3 Pure Backend API Handlers (No Demo Fallbacks)
  // ---------------------------------------------------------------------------

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const updated = await missionApi.acceptMission(
        mission.id,
        mission.operatorId || 'OP-001',
      )
      setMission(updated)
    } catch (err) {
      alert(`${t.apiAcceptError} ${(err as Error).message}`)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async () => {
    try {
      const updated = await missionApi.rejectMission(
        mission.id,
        rejectReason || t.defaultRejectReason,
        mission.operatorId || 'OP-001',
      )
      setMission(updated)
      setShowRejectModal(false)
    } catch (err) {
      alert(`${t.apiRejectError} ${(err as Error).message}`)
    }
  }

  const handleConnectGcs = async () => {
    setIsConnecting(true)
    try {
      const updated = await missionApi.connectGcs(mission.id)
      setMission(updated)
      setIsGcsConnected(true)
      setDeviceStatus('PREFLIGHT')
    } catch (err) {
      alert(`${t.apiConnectGcsError} ${(err as Error).message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleRunPreflight = async () => {
    setIsConnecting(true)
    try {
      const check = await missionApi.runPreflightCheck(
        mission.id,
        mission.deviceCode || 'DRONE-01',
      )
      setPreflightCheck(check)

      // Refresh mission state from backend
      const updated = await missionApi.getMissionById(mission.id)
      setMission(updated)

      if (check.overallPassed && check.flightToken) {
        setFlightToken(check.flightToken)
      }
    } catch (err) {
      alert(`${t.apiPreflightError} ${(err as Error).message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleReplaceDrone = async () => {
    try {
      const updated = await missionApi.replaceDrone(mission.id, newDeviceCode)
      setMission(updated)
      setDeviceStatus('PREFLIGHT')
      setPreflightCheck(null)
      setFlightToken(null)
      setShowReplaceModal(false)
    } catch (err) {
      alert(`${t.apiReplaceDroneError} ${(err as Error).message}`)
    }
  }

  const handleStartMission = async () => {
    try {
      const updated = await missionApi.startMission(
        mission.id,
        flightToken?.tokenValue,
      )
      setMission(updated)
      setDeviceStatus('ACTIVE_MISSION')
    } catch (err) {
      alert(`${t.apiStartMissionError} ${(err as Error).message}`)
    }
  }

  const handleUploadMedia = async (file: File) => {
    setIsUploading(true)
    try {
      await missionApi.uploadMedia(
        mission.id,
        mission.deviceCode || 'DRONE-01',
        file,
      )
      alert(t.uploadMediaSuccess)
    } catch (err) {
      alert(`${t.apiUploadMediaError} ${(err as Error).message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleMarkReturning = async () => {
    try {
      const updated = await missionApi.markReturning(mission.id)
      setMission(updated)
    } catch (err) {
      alert(`${t.apiMarkReturningError} ${(err as Error).message}`)
    }
  }

  const handlePostflightSubmit = async (
    status: DeviceStatus,
    notes: string,
  ) => {
    try {
      const updated = await missionApi.postFlightStatus(
        mission.id,
        mission.deviceCode || 'DRONE-01',
        status,
        notes,
      )
      setMission(updated)
      setDeviceStatus(status)
      setIsPostflightOpen(false)
    } catch (err) {
      alert(`${t.apiPostflightError} ${(err as Error).message}`)
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-background)',
        minHeight: '100vh',
        padding: '36px 0 80px',
      }}
    >
      <div className="container">
        {/* Operator Hero Card */}
        <div className="operator-hero">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '20px',
            }}
          >
            <div>
              <p className="eyebrow" style={{ margin: '0 0 6px' }}>
                FLOW 3 — DRONE OPERATOR MANAGEMENT SYSTEM
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '8px',
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.9rem',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {t.missionTitle(mission.missionCode)}
                </h1>
                <MissionStatusBadge status={mission.status} />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  color: 'var(--color-body)',
                  lineHeight: 1.6,
                }}
              >
                {t.locationLabel} <strong>{mission.address}</strong> |{' '}
                {t.assignedLabel} <strong>{mission.operatorId}</strong> |{' '}
                {t.deviceLabel} <strong>{mission.deviceCode}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-muted)',
                  fontWeight: 600,
                }}
              >
                {t.droneStatusLabel}
              </span>
              <DeviceStatusBadge status={deviceStatus} />
              <LanguageToggle />
            </div>
          </div>
        </div>

        {/* Flow Step Tracker Bar */}
        <div className="flow-step-tracker">
          <div
            className={`flow-step-node ${currentStep >= 1 ? 'flow-step-node--active' : ''} ${currentStep > 1 ? 'flow-step-node--done' : ''}`}
          >
            <span className="flow-step-number">
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <div className="flow-step-label">
              <strong>{t.step1Title}</strong>
              <small>Accept / Reject</small>
            </div>
          </div>

          <div className="flow-step-divider" />

          <div
            className={`flow-step-node ${currentStep >= 2 ? 'flow-step-node--active' : ''} ${currentStep > 2 ? 'flow-step-node--done' : ''}`}
          >
            <span className="flow-step-number">
              {currentStep > 2 ? '✓' : '2'}
            </span>
            <div className="flow-step-label">
              <strong>{t.step2Title}</strong>
              <small>Diagnostics & Token</small>
            </div>
          </div>

          <div className="flow-step-divider" />

          <div
            className={`flow-step-node ${currentStep >= 3 ? 'flow-step-node--active' : ''} ${currentStep > 3 ? 'flow-step-node--done' : ''}`}
          >
            <span className="flow-step-number">
              {currentStep > 3 ? '✓' : '3'}
            </span>
            <div className="flow-step-label">
              <strong>{t.step3Title}</strong>
              <small>Live HUD & Upload</small>
            </div>
          </div>

          <div className="flow-step-divider" />

          <div
            className={`flow-step-node ${currentStep >= 4 ? 'flow-step-node--active' : ''}`}
          >
            <span className="flow-step-number">4</span>
            <div className="flow-step-label">
              <strong>{t.step4Title}</strong>
              <small>Post-flight Inspection</small>
            </div>
          </div>
        </div>

        {/* Telemetry Indicator */}
        <div className="mock-test-bar">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              <Icon name="activity" /> {t.telemetryBarLabel}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <label
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-foreground)',
                  fontWeight: 700,
                }}
              >
                {t.batteryLabel}{' '}
                <span
                  className="mono"
                  style={{ color: batteryLevel >= 80 ? '#15803d' : '#b91c1c' }}
                >
                  {batteryLevel}%
                </span>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(Number(e.target.value))}
                  style={{
                    marginLeft: '10px',
                    verticalAlign: 'middle',
                    cursor: 'pointer',
                  }}
                />
              </label>

              <label
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-foreground)',
                  fontWeight: 700,
                }}
              >
                {t.gpsLabel}{' '}
                <span
                  className="mono"
                  style={{ color: gpsSatellites >= 8 ? '#15803d' : '#b91c1c' }}
                >
                  {gpsSatellites}
                </span>
                <input
                  type="range"
                  min="4"
                  max="18"
                  value={gpsSatellites}
                  onChange={(e) => setGpsSatellites(Number(e.target.value))}
                  style={{
                    marginLeft: '10px',
                    verticalAlign: 'middle',
                    cursor: 'pointer',
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* PHASE 1: ACCEPTANCE GATE (F3.1) */}
        {/* ------------------------------------------------------------------ */}
        {(mission.status === 'WAITING_OPERATOR_ACCEPTANCE' ||
          mission.status === 'READY') && (
          <div
            className="card"
            style={{ padding: '32px', marginBottom: '32px' }}
          >
            <div style={{ marginBottom: '24px' }}>
              <p
                className="eyebrow"
                style={{ margin: '0 0 4px', fontSize: '0.65rem' }}
              >
                F3.1 OPERATOR ACCEPTANCE GATE
              </p>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                {t.confirmAcceptanceTitle}
              </h2>
              <p className="section-copy" style={{ marginTop: '8px' }}>
                {t.confirmAcceptancePrefix}{' '}
                <strong>{mission.missionCode}</strong>{' '}
                {t.confirmAcceptanceSuffix}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                icon="check"
                onClick={handleAccept}
                disabled={isAccepting}
                style={{ backgroundColor: '#15803d', padding: '0 32px' }}
              >
                {isAccepting ? t.creatingPlan : t.acceptMission}
              </Button>

              <Button
                variant="secondary"
                icon="x"
                onClick={() => setShowRejectModal(true)}
                style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
              >
                {t.rejectMission}
              </Button>
            </div>
          </div>
        )}

        {plan && (
          <div
            className="card"
            style={{
              padding: '24px',
              marginBottom: '32px',
              borderColor: planIsFeasible ? '#bbf7d0' : '#fecaca',
              background: planIsFeasible
                ? 'color-mix(in srgb, #166534 5%, var(--color-surface))'
                : 'color-mix(in srgb, #991b1b 5%, var(--color-surface))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '18px',
              }}
            >
              <div>
                <p className="eyebrow" style={{ margin: '0 0 4px' }}>
                  AUTO MISSION PLANNING
                </p>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  {plan.planningAlgorithm}
                </h2>
              </div>
              <span
                className="mono"
                style={{
                  color: planIsFeasible ? '#15803d' : '#b91c1c',
                  fontWeight: 800,
                }}
              >
                {plan.feasibilityStatus}
              </span>
            </div>

            {planIsFeasible ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                }}
              >
                <PlanMetric
                  label="Distance"
                  value={formatMeters(plan.plannedDistanceM)}
                />
                <PlanMetric
                  label="Duration"
                  value={formatSeconds(plan.plannedDurationSec)}
                />
                <PlanMetric
                  label="World Z"
                  value={formatMeters(plan.maxPlannedAltitudeM)}
                />
                <PlanMetric
                  label="Energy"
                  value={formatMah(plan.estimatedEnergyMah)}
                />
                <PlanMetric
                  label="Battery Capacity"
                  value={formatMah(plan.batteryCapacityMah)}
                />
                <PlanMetric
                  label="Current Battery"
                  value={formatPercent(plan.availableBatteryPercentAtPlanning)}
                />
                <PlanMetric
                  label="Battery Use"
                  value={formatPercent(plan.estimatedBatteryUsedPercent)}
                />
                <PlanMetric
                  label="After Mission"
                  value={formatPercent(plan.estimatedRemainingBatteryPercent)}
                />
                <PlanMetric
                  label="Safety Reserve"
                  value={formatPercent(plan.safetyReservePercent)}
                />
                <PlanMetric
                  label="Required Battery"
                  value={formatPercent(plan.requiredBatteryPercent)}
                />
                <PlanMetric
                  label="Waypoints"
                  value={`${plan.waypoints?.length ?? 0}`}
                />
              </div>
            ) : (
              <p style={{ margin: 0, color: '#b91c1c', fontWeight: 700 }}>
                {planFeasibilityMessage(plan.feasibilityStatus, lang)}
              </p>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PHASE 2 & 3: GCS CONNECT & PREFLIGHT DIAGNOSTICS (F3.2) */}
        {/* ------------------------------------------------------------------ */}
        {(canEnterPreflight || mission.status === 'PENDING_APPROVAL') && (
          <div style={{ marginBottom: '32px' }}>
            <PreflightDiagnosticCard
              check={preflightCheck}
              token={flightToken}
              batteryLevel={batteryLevel}
              gpsSatellites={gpsSatellites}
              isConnecting={isConnecting}
              onRunPreflight={handleRunPreflight}
              onConnectGcs={handleConnectGcs}
              isGcsConnected={isGcsConnected || mission.status !== 'SCHEDULED'}
            />

            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              {mission.status === 'PENDING_APPROVAL' && (
                <Button
                  variant="secondary"
                  icon="route"
                  onClick={() => setShowReplaceModal(true)}
                >
                  {t.replaceDroneStandby}
                </Button>
              )}

              {mission.status === 'READY_TO_FLY' && (
                <Button
                  variant="primary"
                  icon="arrow-up-right"
                  onClick={handleStartMission}
                  style={{
                    minHeight: '52px',
                    padding: '0 40px',
                    backgroundColor: '#15803d',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    boxShadow: '0 10px 25px rgba(21, 128, 61, 0.3)',
                  }}
                >
                  {t.startFlight}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PHASE 4: LIVE FLIGHT EXECUTION (F3.3) */}
        {/* ------------------------------------------------------------------ */}
        {(mission.status === 'IN_FLIGHT' ||
          mission.status === 'IN_PROGRESS' ||
          mission.status === 'RETURNING') && (
          <div style={{ marginBottom: '32px' }}>
            <FlightTelemetryHUD
              deviceCode={mission.deviceCode || 'DRONE-01'}
              missionId={mission.id}
              onUploadMedia={handleUploadMedia}
              onReturnToBase={handleMarkReturning}
              isUploading={isUploading}
            />

            {mission.status === 'RETURNING' && (
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <Button
                  variant="primary"
                  icon="clipboard"
                  onClick={() => setIsPostflightOpen(true)}
                  style={{ padding: '0 32px' }}
                >
                  {t.openPostflight}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PHASE 5: COMPLETED MISSION STATE */}
        {/* ------------------------------------------------------------------ */}
        {mission.status === 'COMPLETED' && (
          <div
            style={{
              background:
                'color-mix(in srgb, #166534 8%, var(--color-surface))',
              border: '1px solid #bbf7d0',
              borderRadius: '20px',
              padding: '48px 32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#15803d',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Icon name="check" style={{ width: '36px', height: '36px' }} />
            </div>
            <h2
              style={{
                margin: '0 0 10px',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#166534',
              }}
            >
              {t.missionCompletedTitle(mission.missionCode)}
            </h2>
            <p
              className="section-copy"
              style={{ margin: '0 auto 28px', maxWidth: '520px' }}
            >
              {t.missionCompletedDescriptionPrefix}{' '}
              <strong>{mission.deviceCode}</strong>{' '}
              {t.missionCompletedDescriptionSuffix}
            </p>
          </div>
        )}

        {/* Modals */}
        {showRejectModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 100,
              display: 'grid',
              placeItems: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: '1.2rem',
                  color: 'var(--color-foreground)',
                }}
              >
                {t.rejectModalTitle}
              </h3>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t.rejectReasonPlaceholder}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  marginBottom: '20px',
                  background: 'var(--color-background)',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  {t.cancel}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleReject}
                  style={{ backgroundColor: '#b91c1c' }}
                >
                  {t.confirmReject}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showReplaceModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 100,
              display: 'grid',
              placeItems: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: '1.2rem',
                  color: 'var(--color-foreground)',
                }}
              >
                {t.replaceModalTitle}
              </h3>
              <select
                value={newDeviceCode}
                onChange={(e) => setNewDeviceCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  marginBottom: '20px',
                  background: 'var(--color-background)',
                  fontWeight: 600,
                }}
              >
                <option value="DRONE-02">
                  DRONE-02 (PX4 Quadcopter Beta - AVAILABLE)
                </option>
                <option value="DRONE-03">
                  DRONE-03 (PX4 Hexacopter Gamma - AVAILABLE)
                </option>
              </select>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => setShowReplaceModal(false)}
                >
                  {t.cancel}
                </Button>
                <Button variant="primary" onClick={handleReplaceDrone}>
                  {t.confirmReplace}
                </Button>
              </div>
            </div>
          </div>
        )}

        <PostflightModal
          isOpen={isPostflightOpen}
          onClose={() => setIsPostflightOpen(false)}
          onSubmit={handlePostflightSubmit}
          isSubmitting={isConnecting}
        />
      </div>
    </div>
  )
}
