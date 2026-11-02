import { useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { useActiveMission } from '../../api/useActiveMission'
import {
  handoverAcknowledgedStorageKey,
  preflightReadyStorageKey,
} from '../../lib/flightWorkflowStorage'
import { formatDeviceLabel } from '../../lib/deviceLabel'
import { flightControlApi } from '../../api/flightControlApi'
import { operatorHref } from '../../routes'
import { FlightStepHeader } from '../../components/common/FlightStepper'
import { RevokedBanner } from './components/HandoverBanners'
import { handoverPageMessages } from './HandoverPage.messages'
import { DroneStrip } from './components/DroneStrip'
import { CommitmentsCard } from './components/CommitmentsCard'
import { AckToggle } from './components/AckToggle'
import { HandoverActions } from './components/HandoverActions'
import './HandoverPage.css'

/** OPR-05W — Bàn giao quyền điều khiển: 4 cam kết + tick tổng + xác nhận. */
export function HandoverPage({ missionId }: { missionId?: string }) {
  const mission = useActiveMission(missionId)
  const { t } = useI18n(handoverPageMessages)
  const COMMITMENTS = t.commitments
  const missionLabel =
    mission.data?.missionCode ?? mission.missionId ?? t.noMissionSelected
  const deviceLabel = mission.data ? formatDeviceLabel(mission.data) : null
  const [revoked, setRevoked] = useState(false)
  const [checked, setChecked] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ])
  const [ack, setAck] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allChecked = checked.every(Boolean)
  const deviceReadyToFly =
    mission.data?.deviceAssignments?.some(
      (assignment) =>
        assignment.deviceRole === 'MAIN' &&
        assignment.deviceId === mission.data?.deviceId &&
        assignment.status === 'READY_TO_FLY',
    ) === true
  const missionAwaitingHandover =
    mission.data?.status === 'PENDING_CONFIRMATION'
  const canConfirm =
    allChecked &&
    ack &&
    deviceReadyToFly &&
    missionAwaitingHandover &&
    !submitting

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      const data = mission.data
      const deviceId = data?.deviceId
      if (!mission.missionId || !deviceId)
        throw new Error(t.noDroneAssignedError)
      if (!missionAwaitingHandover)
        throw new Error(t.crewAcceptanceRequired)
      if (!deviceReadyToFly) throw new Error(t.precheckRequiredError)

      await flightControlApi
        .bindSession(mission.missionId, deviceId)
        .catch(() => undefined)
      await missionApi.handoverMyMission(mission.missionId)
      window.sessionStorage.setItem(
        handoverAcknowledgedStorageKey(mission.missionId),
        'true',
      )
      window.localStorage.setItem(
        preflightReadyStorageKey(
          data?.missionCode ?? mission.missionId,
          deviceId,
        ),
        'true',
      )
      window.localStorage.setItem(
        preflightReadyStorageKey(mission.missionId, deviceId),
        'true',
      )
      window.location.hash = operatorHref({
        screen: 'missionDetail',
        missionId: mission.missionId,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.confirmFailed)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="odm-card handover-page" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={t.stepTitle}
        missionId={missionLabel}
        active={4}
      />
      <div className="handover-page__content">
        <div className="handover-page__stack">
          {error && (
            <p className="handover-page__error" role="alert">
              {error}
            </p>
          )}
          <DroneStrip
            missionLabel={missionLabel}
            droneLabel={deviceLabel ?? t.noDroneAssigned}
          />

          {revoked ? (
            <RevokedBanner onReconfirm={() => setRevoked(false)} />
          ) : (
            <>
              <section
                className="odm-card"
                aria-labelledby="handover-commitments-title"
              >
                <CommitmentsCard
                  COMMITMENTS={COMMITMENTS}
                  checked={checked}
                  setChecked={setChecked}
                />
              </section>

              <button
                type="button"
                onClick={() => setAck((v) => !v)}
                className="handover-page__ack"
                aria-pressed={ack}
              >
                <AckToggle ack={ack} />
              </button>

              <div className="handover-page__actions">
                <HandoverActions
                  mission={mission}
                  canConfirm={canConfirm}
                  handleConfirm={handleConfirm}
                  submitting={submitting}
                />
              </div>
              <div className="handover-page__note">{t.confirmLockedNote}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
