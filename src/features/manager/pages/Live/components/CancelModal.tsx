import type { MissionCalendarItem } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { livePageMessages } from '../LivePage.messages'
import { useState } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../../api/planningApi'
import { missionsApi } from '../../../api/missionsApi'
import { planningError } from '../../../lib/planningErrors'
import { managerHref } from '../../../routes'

// ── CancelModal (2-step) ───────────────────────────────────────────────────

export function CancelModal({
  mission,
  onClose,
  onCancelled,
}: {
  mission: MissionCalendarItem
  onClose: () => void
  onCancelled: () => void
}) {
  const { t } = useI18n(livePageMessages)
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const planQuery = useApiQuery(
    (signal) => planningApi.getExecutionPlan(mission.orderId, signal),
    [mission.orderId],
  )
  const capabilities = useApiQuery(
    (signal) => planningApi.getSafeStop(mission.id, signal),
    [mission.id],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      capabilities.loading ||
      capabilities.error ||
      capabilities.data?.canCancelMission !== true
    ) {
      setError(
        'Mission chưa đủ điều kiện hủy. Cần hoàn tất xác nhận an toàn và đóng phiên vận hành trước khi hủy.',
      )
      return
    }
    if (!planQuery.data || planQuery.loading || planQuery.error) {
      setError('Cần tải lại kế hoạch trước khi hủy.')
      return
    }
    if (!reason.trim()) {
      setError(t.cancelModal.reasonRequired)
      return
    }
    if (confirmCode !== mission.missionCode) {
      setError(t.cancelModal.codeMismatch(mission.missionCode))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await missionsApi.cancelMission(mission.id, {
        reason,
        expectedPlanRevision: planQuery.data.revision,
      })
      onCancelled()
    } catch (err) {
      setError(planningError(err))
      planQuery.reload()
      capabilities.reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.cancelModal.ariaLabel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <form
        onSubmit={handleConfirm}
        style={{
          background: 'var(--sf)',
          borderRadius: 10,
          padding: 24,
          width: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {step === 1 ? (
          <>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--red-fg)',
              }}
            >
              {t.cancelModal.step1Title}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--tx2)' }}>
              Mission{' '}
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {mission.missionCode}
              </strong>{' '}
              {t.cancelModal.step1Body}
            </p>
            <label style={{ fontSize: 13 }}>
              {t.cancelModal.reasonLabel}
              <textarea
                className="odm-inp"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ display: 'block', marginTop: 4, width: '100%' }}
                placeholder={t.cancelModal.reasonPlaceholder}
                autoFocus
              />
            </label>
            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
            >
              <button type="button" className="odm-btn" onClick={onClose}>
                {t.cancelModal.close}
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-rd"
                disabled={!reason.trim()}
                onClick={() => {
                  setError(null)
                  setStep(2)
                }}
              >
                {t.cancelModal.continue}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--red-fg)',
              }}
            >
              {t.cancelModal.step2Title}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--tx2)' }}>
              {t.cancelModal.step2Body}
            </p>
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                background: 'var(--sf3)',
                padding: '4px 10px',
                borderRadius: 5,
                display: 'block',
                textAlign: 'center',
              }}
            >
              {mission.missionCode}
            </code>
            <label style={{ fontSize: 13 }}>
              {t.cancelModal.confirmCodeLabel}
              <input
                type="text"
                className="odm-inp"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder={mission.missionCode}
                style={{ display: 'block', marginTop: 4, width: '100%' }}
                autoFocus
              />
            </label>
            {error && (
              <div
                role="alert"
                style={{
                  fontSize: 12,
                  color: 'var(--red-fg)',
                  background: 'var(--red-bg)',
                  borderRadius: 6,
                  padding: '6px 10px',
                }}
              >
                {error}
                <a
                  href={managerHref({
                    screen: 'orderReview',
                    orderId: mission.orderId,
                  })}
                >
                  Xem kế hoạch Order
                </a>
              </div>
            )}
            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
            >
              <button
                type="button"
                className="odm-btn"
                onClick={() => setStep(1)}
              >
                {t.cancelModal.back}
              </button>
              <button
                type="submit"
                className="odm-btn odm-btn-rd"
                disabled={
                  saving ||
                  capabilities.loading ||
                  Boolean(capabilities.error) ||
                  capabilities.data?.canCancelMission !== true
                }
              >
                {saving
                  ? t.cancelModal.cancelling
                  : t.cancelModal.confirmCancel}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
