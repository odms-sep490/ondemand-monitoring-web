import { useEffect, useState } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { preflightPageMessages } from '../PreflightPage.messages'
import { humanizePreflightDisplayText, statusText } from '../preflightHelpers'
import type { ItemState } from '../preflightTypes'
import type { PreflightItemDef } from './PreflightItem'
import './PreflightChecklist.css'

export function RuntimePreflightItemRow({
  def,
  state,
  manual,
  updating,
  onUpdate,
}: {
  def: PreflightItemDef
  state: ItemState
  manual: boolean
  updating: boolean
  onUpdate: (
    checkType: string,
    status: 'PASSED' | 'FAILED',
    message: string,
    measuredValue?: string,
  ) => Promise<void>
}) {
  const { t } = useI18n(preflightPageMessages)
  const failed = state.result === 'fail'
  const passed = state.result === 'ok'
  const checking = state.status === 'CHECKING'
  const decided = passed || failed
  const [showFailureReason, setShowFailureReason] = useState(false)
  const [failureReason, setFailureReason] = useState('')
  const [batteryPercent, setBatteryPercent] = useState(
    state.measuredValue?.replace('%', '') ?? '',
  )
  const [batteryError, setBatteryError] = useState<string | null>(null)
  useEffect(() => {
    setBatteryPercent(state.measuredValue?.replace('%', '') ?? '')
  }, [state.measuredValue])
  const resultLabel = failed
    ? t.itemFail
    : passed
      ? t.itemPass
      : checking
        ? t.itemChecking
        : t.itemPending
  const displayMessage = humanizePreflightDisplayText(
    statusText(t, state.status, state.message),
    { [def.key.toLowerCase()]: def.label },
  )

  return (
    <div
      className={`preflight-item-row${failed ? ' is-failed' : ''}${passed ? ' is-passed' : ''}`}
      style={{
        background: failed ? 'var(--red-bg)' : 'var(--sf)',
        border: `1.5px solid ${
          failed ? 'var(--red-dot)' : passed ? 'var(--green-dot)' : 'var(--bd)'
        }`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div className="preflight-item-row__main">
        <span
          className="preflight-item-row__marker"
          aria-hidden="true"
          style={{
            background: passed
              ? 'var(--green-bg)'
              : failed
                ? 'var(--red-solid)'
                : 'var(--sf3)',
            color: passed
              ? 'var(--green-fg)'
              : failed
                ? 'var(--red-on)'
                : 'var(--tx2)',
          }}
        >
          {passed ? '✓' : failed ? '✕' : checking ? '◌' : '•'}
        </span>

        <div className="preflight-item-row__content">
          <div className="preflight-item-row__title">{def.label}</div>
          <div className="preflight-item-row__detail">{def.detail}</div>
          <div
            className="preflight-item-row__message"
            style={{ color: failed ? 'var(--red-fg)' : 'var(--tx3)' }}
            title={displayMessage}
          >
            {displayMessage}
          </div>
        </div>

        {def.key === 'battery_health' && manual && !decided ? (
          <div className="preflight-item-row__battery-entry">
            <label htmlFor="preflight-battery-percent">
              {t.batteryPercent}
            </label>
            <div className="preflight-item-row__battery-controls">
              <input
                id="preflight-battery-percent"
                className="odm-input"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="any"
                value={batteryPercent}
                aria-label={t.batteryPercent}
                placeholder={t.batteryPercentPlaceholder}
                disabled={updating}
                onChange={(event) => {
                  setBatteryPercent(event.target.value)
                  setBatteryError(null)
                }}
              />
              <button
                type="button"
                className="odm-btn odm-btn-p preflight-item-row__battery-action"
                disabled={updating || batteryPercent.trim().length === 0}
                onClick={() => {
                  const value = Number(batteryPercent)
                  if (!Number.isFinite(value) || value < 0 || value > 100) {
                    setBatteryError(t.batteryPercentInvalid)
                    return
                  }
                  setBatteryError(null)
                  void onUpdate(
                    def.key,
                    'PASSED',
                    'Người vận hành nhập mức pin thủ công',
                    String(value),
                  ).catch(() => undefined)
                }}
              >
                {updating ? t.itemChecking : t.recordBattery}
              </button>
            </div>
            {batteryError ? (
              <span className="preflight-item-row__battery-error" role="alert">
                {batteryError}
              </span>
            ) : null}
          </div>
        ) : manual && !decided ? (
          <div className="preflight-item-row__actions">
            <button
              type="button"
              className="odm-btn odm-btn-ok preflight-item-row__decision"
              disabled={updating}
              onClick={() => {
                void onUpdate(def.key, 'PASSED', 'Người vận hành xác nhận đạt')
                  .then(() => {
                    setShowFailureReason(false)
                  })
                  .catch(() => undefined)
              }}
            >
              {updating ? '...' : 'Đạt'}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-rd preflight-item-row__decision"
              aria-expanded={showFailureReason}
              disabled={updating}
              onClick={() => setShowFailureReason((value) => !value)}
            >
              Không đạt
            </button>
          </div>
        ) : manual ? (
          <span
            className={`preflight-item-row__result ${failed ? 'is-failed' : 'is-passed'}`}
          >
            {def.key === 'battery_health' && state.measuredValue
              ? `${resultLabel} · ${state.measuredValue}`
              : resultLabel}
          </span>
        ) : (
          <span
            className={`preflight-item-row__result ${
              failed ? 'is-failed' : passed ? 'is-passed' : 'is-pending'
            }`}
          >
            {resultLabel}
          </span>
        )}
      </div>

      {manual && !decided && showFailureReason ? (
        <div className="preflight-item-row__failure">
          <input
            id={`preflight-failure-${def.key}`}
            className="odm-input"
            aria-label={t.failureReasonPlaceholder}
            value={failureReason}
            onChange={(event) => setFailureReason(event.target.value)}
            placeholder={t.failureReasonPlaceholder}
          />
          <button
            type="button"
            className="odm-btn odm-btn-rd preflight-item-row__failure-submit"
            disabled={updating || failureReason.trim().length === 0}
            onClick={() =>
              void onUpdate(def.key, 'FAILED', failureReason.trim())
                .then(() => {
                  setShowFailureReason(false)
                  setFailureReason('')
                })
                .catch(() => undefined)
            }
          >
            {t.confirmFailure}
          </button>
        </div>
      ) : null}
    </div>
  )
}
