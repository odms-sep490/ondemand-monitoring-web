import type {
  MissionCalendarItem,
  LiveTelemetry,
} from '../../../types/missions'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ApiError } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import { livePageMessages } from '../LivePage.messages'
import { missionsApi } from '../../../api/missionsApi'
import { POLL_INTERVAL_MS } from '../liveHelpers'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { MapPlaceholder } from './MapPlaceholder'
import { IncidentModal } from './IncidentModal'
import { CancelModal } from './CancelModal'
import { LiveTopBar } from './LiveTopBar'
import { TelemetryPanel } from './TelemetryPanel'
import { LiveActions } from './LiveActions'
import { IncidentLog } from './IncidentLog'

// ── LiveMainPanel ──────────────────────────────────────────────────────────

export function LiveMainPanel({
  mission,
  onCancelled,
}: {
  mission: MissionCalendarItem
  onCancelled: () => void
}) {
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null)
  const [telemetryError, setTelemetryError] = useState<ApiError | null>(null)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const { t } = useI18n(livePageMessages)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const liveRequest = useRef<AbortController | null>(null)

  const fetchLive = useCallback(async () => {
    liveRequest.current?.abort()
    const abort = new AbortController()
    liveRequest.current = abort
    try {
      const data = await missionsApi.getLive(mission.id, abort.signal)
      if (abort.signal.aborted) return
      setTelemetry(data)
      setTelemetryError(null)
    } catch (err) {
      if (abort.signal.aborted) return
      if (err instanceof ApiError) setTelemetryError(err)
    }
  }, [mission.id])

  useEffect(() => {
    fetchLive()
    intervalRef.current = setInterval(fetchLive, POLL_INTERVAL_MS)
    return () => {
      liveRequest.current?.abort()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchLive])

  const tone = missionStatusTone[mission.status] ?? 'gray'

  return (
    <>
      {/* Top bar */}
      <LiveTopBar
        mission={mission}
        tone={tone}
        setShowIncidentModal={setShowIncidentModal}
        setShowCancelModal={setShowCancelModal}
      />

      {/* Telemetry error */}
      {telemetryError && (
        <div
          role="alert"
          style={{
            padding: '8px 16px',
            background: 'var(--red-bg)',
            color: 'var(--red-fg)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>
            {t.telemetryLost} ·{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>
              GET /missions/{mission.id}/live · {telemetryError.status ?? '—'}
            </code>
          </span>
          <button
            type="button"
            className="odm-btn"
            style={{ marginLeft: 'auto' }}
            onClick={fetchLive}
          >
            {t.retry}
          </button>
        </div>
      )}

      {/* Map */}
      <MapPlaceholder
        lat={telemetry?.latitude ?? mission.centerLat ?? null}
        lon={telemetry?.longitude ?? mission.centerLon ?? null}
        missionCode={mission.missionCode}
      />

      {/* Telemetry cells */}
      {telemetry && <TelemetryPanel telemetry={telemetry} />}

      {/* Livestream block */}
      {telemetry && <LiveActions telemetry={telemetry} />}

      {/* Incident log */}
      {telemetry && telemetry.activeIncidents.length > 0 && (
        <IncidentLog telemetry={telemetry} />
      )}

      {/* Modals */}
      {showIncidentModal && (
        <IncidentModal
          missionId={mission.id}
          onClose={() => setShowIncidentModal(false)}
          onCreated={() => {
            setShowIncidentModal(false)
            fetchLive()
          }}
        />
      )}
      {showCancelModal && (
        <CancelModal
          mission={mission}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => {
            setShowCancelModal(false)
            onCancelled()
          }}
        />
      )}
    </>
  )
}
