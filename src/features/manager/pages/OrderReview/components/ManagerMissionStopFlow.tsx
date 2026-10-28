import { useEffect, useRef, useState } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../../api/planningApi'
import {
  hasStopRequest,
  managerStopAction,
  safeStopError,
} from '../../../../mission/lib/safeStopPresentation'
import { usePlanningConfirmation } from '../../../components/common/usePlanningConfirmation'
import { useToast } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { StopFlowActions } from './StopFlowActions'
import { StopFlowPanel } from './StopFlowPanel'
import { managerMissionStopFlowMessages } from './ManagerMissionStopFlow.messages'

/** Backend capabilities remain the source of truth; no crew attestation here. */
export function ManagerMissionStopFlow({
  missionId,
  missionCode,
  status,
  revision,
  refreshKey,
  writable,
  draft,
  active,
  blocked,
  onChanged,
  onCapabilitiesChanged,
  onRuntimeBlocked,
  onBusyChanged,
}: {
  missionId: string
  missionCode: string
  status: string
  revision: number
  refreshKey: object
  writable: boolean
  draft: boolean
  active: boolean
  blocked: boolean
  onChanged: () => void
  onCapabilitiesChanged: (id: string, allowed: boolean) => void
  onRuntimeBlocked: (id: string, blocked: boolean) => void
  onBusyChanged: (id: string, dirty: boolean, busy: boolean) => void
}) {
  const query = useApiQuery(
    (signal) => planningApi.getSafeStop(missionId, signal),
    [missionId, revision, refreshKey],
  )
  const [intent, setIntent] = useState<'cancel' | null>(null)
  const confirmation = usePlanningConfirmation()
  const { t: fb } = useI18n(managerFeedbackMessages)
  const { t } = useI18n(managerMissionStopFlowMessages)
  const toast = useToast()
  const flowRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (intent && active) flowRef.current?.focus()
  }, [intent, active])
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const terminal = ['COMPLETED', 'CANCELLED'].includes(status)
  const stop = query.data
  const ready = !query.loading && !query.error && stop?.missionId === missionId
  useEffect(() => {
    onBusyChanged(`stop:${missionId}`, false, busy)
  }, [missionId, busy, onBusyChanged])
  useEffect(() => {
    onCapabilitiesChanged(
      missionId,
      Boolean(ready && !terminal && stop?.canCancelMission === true),
    )
    onRuntimeBlocked(
      missionId,
      Boolean(!ready || terminal || stop?.status || stop?.requestedAt),
    )
  }, [
    missionId,
    ready,
    terminal,
    stop,
    onCapabilitiesChanged,
    onRuntimeBlocked,
  ])
  const allowed = ready && writable && !terminal && active && !blocked && !busy
  const nextAction = ready ? managerStopAction(stop) : null
  const requested = Boolean(stop && hasStopRequest(stop))
  const actionReason = requested
    ? stop?.reason?.trim() || reason.trim()
    : reason.trim()
  function refresh() {
    query.reload()
    onChanged()
  }
  const relevant =
    stop?.canRequestSafeStop === true ||
    stop?.canCleanupSafeStop === true ||
    (Boolean(stop?.status) && typeof stop?.canCancelMission === 'boolean')
  async function command(action: 'request' | 'cleanup' | 'cancel') {
    const permission = {
      request: stop?.canRequestSafeStop,
      cleanup: stop?.canCleanupSafeStop,
      cancel: stop?.canCancelMission,
    }[action]
    if (
      !allowed ||
      permission !== true ||
      action !== nextAction ||
      (action !== 'cleanup' && !actionReason)
    )
      return
    if (
      !(await confirmation.confirm({
        title:
          action === 'request'
            ? fb.requestSafeStopTitle
            : action === 'cleanup'
              ? t.releaseTitle
              : t.cancelTitle,
        body:
          action === 'request'
            ? fb.requestSafeStopBody
            : action === 'cleanup'
              ? t.releaseBody(missionCode)
              : t.cancelBody(missionCode),
        action:
          action === 'request'
            ? fb.requestSafeStopAction
            : action === 'cleanup'
              ? t.releaseAction
              : t.cancelAction,
        tone: 'danger',
      }))
    )
      return
    setBusy(true)
    setMessage('')
    try {
      if (action === 'request')
        await planningApi.requestSafeStop(missionId, {
          expectedPlanRevision: revision,
          reason: actionReason,
        })
      if (action === 'cleanup') await planningApi.cleanupSafeStop(missionId)
      if (action === 'cancel') {
        await planningApi.cancelMission(missionId, {
          expectedPlanRevision: revision,
          reason: actionReason,
        })
        setIntent(null)
      }
      setMessage(t.recorded)
      toast.success(
        action === 'request'
          ? fb.safeStopRequested
          : action === 'cleanup'
            ? fb.safeStopCleaned
            : fb.missionCancelled,
      )
    } catch (error) {
      setMessage(safeStopError(error))
      toast.error(safeStopError(error))
    } finally {
      setBusy(false)
      refresh()
    }
  }
  if (terminal) return null
  return (
    <>
      {confirmation.dialog}
      {writable && ready && !intent && (
        <StopFlowActions
          stop={stop}
          requested={requested}
          relevant={relevant}
          missionId={missionId}
          allowed={allowed}
          triggerRef={triggerRef}
          setIntent={setIntent}
          query={query}
          missionCode={missionCode}
        />
      )}
      {intent && (
        <StopFlowPanel
          flowRef={flowRef}
          missionCode={missionCode}
          busy={busy}
          query={query}
          ready={ready}
          stop={stop!}
          requested={requested}
          refresh={refresh}
          setIntent={setIntent}
          missionId={missionId}
          intent={intent}
          triggerRef={triggerRef}
          reason={reason}
          nextAction={nextAction}
          setReason={setReason}
          actionReason={actionReason}
          draft={draft}
          allowed={allowed}
          command={command}
          message={message}
        />
      )}
    </>
  )
}
