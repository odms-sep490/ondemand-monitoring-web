import type { PreflightItemDef } from './PreflightItem'
import type { ItemState } from '../preflightTypes'
import { useI18n } from '../../../../../shared/i18n'
import { preflightPageMessages } from '../PreflightPage.messages'
import { statusText } from '../preflightHelpers'
import { useState } from 'react'

export function RuntimePreflightItemRow({
  def,
  state,
  manual,
  updating,
  onUpdate,
  onRecheck,
}: {
  def: PreflightItemDef
  state: ItemState
  manual: boolean
  updating: boolean
  onUpdate: (
    checkType: string,
    status: 'PASSED' | 'FAILED',
    message: string,
  ) => Promise<void>
  onRecheck: (checkType: string) => Promise<void>
}) {
  const { t } = useI18n(preflightPageMessages)
  const failed = state.result === 'fail'
  const passed = state.result === 'ok'
  const checking = state.status === 'CHECKING'
  const decided = passed || failed
  const [showFailureReason, setShowFailureReason] = useState(false)
  const [failureReason, setFailureReason] = useState('')
  const tone = failed
    ? {
        label: t.itemFail,
        bg: 'var(--red-solid)',
        fg: 'var(--red-on)',
        border: 'var(--red-solid)',
      }
    : passed
      ? {
          label: t.itemPass,
          bg: 'var(--green-solid)',
          fg: 'var(--green-on)',
          border: 'var(--green-solid)',
        }
      : {
          label: checking ? t.itemChecking : t.itemPending,
          bg: 'var(--sf3)',
          fg: 'var(--tx2)',
          border: 'var(--bd2)',
        }

  return (
    <div
      style={{
        background: failed ? 'var(--red-bg)' : 'var(--sf)',
        border: `1.5px solid ${
          failed ? 'var(--red-dot)' : passed ? 'var(--green-dot)' : 'var(--bd)'
        }`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '44px minmax(0, 1fr) auto',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
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
            fontWeight: 700,
          }}
        >
          {passed
            ? '✓'
            : failed
              ? '✕'
              : state.status === 'CHECKING'
                ? '◌'
                : '•'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.2 }}>
            {def.label}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
            {def.detail ? `${def.detail} · ` : ''}
            <span className="odm-mono">{def.code}</span>
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              color: failed ? 'var(--red-fg)' : 'var(--tx3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={statusText(t, state.status, state.message)}
          >
            {statusText(t, state.status, state.message)}
          </div>
        </div>
        {manual && !decided ? (
          <div style={{ display: 'flex', gap: 6, justifySelf: 'end' }}>
            <button
              type="button"
              className="odm-btn odm-btn-ok"
              disabled={updating}
              onClick={() => {
                void onUpdate(
                  def.key,
                  'PASSED',
                  'Người vận hành xác nhận đạt',
                )
                  .then(() => {
                    setShowFailureReason(false)
                  })
                  .catch(() => undefined)
              }}
              style={{ minWidth: 72 }}
            >
              {updating ? '...' : 'Đạt'}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-rd"
              disabled={updating}
              onClick={() => setShowFailureReason((value) => !value)}
              style={{ minWidth: 96 }}
            >
              Không đạt
            </button>
          </div>
        ) : manual ? (
            <span
              style={{
                minWidth: 88,
                height: 32,
                padding: '0 12px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                border: `1px solid ${tone.border}`,
                background: tone.bg,
                color: tone.fg,
                fontSize: 12,
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              {tone.label}
            </span>
        ) : def.key === 'battery_health' && !decided ? (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={updating}
            onClick={() =>
              void onRecheck(def.key).catch(() => undefined)
            }
            style={{ minWidth: 132 }}
          >
            {updating ? t.itemChecking : t.fetchCurrentBattery}
          </button>
        ) : (
          <span
            style={{
              justifySelf: 'end',
              minWidth: 112,
              height: 32,
              padding: '0 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              border: `1px solid ${tone.border}`,
              background: tone.bg,
              color: tone.fg,
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            {tone.label}
          </span>
        )}
      </div>
      {manual && !decided && showFailureReason ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            className="odm-input"
            value={failureReason}
            onChange={(event) => setFailureReason(event.target.value)}
            placeholder={t.failureReasonPlaceholder}
          />
          <button
            type="button"
            className="odm-btn odm-btn-rd"
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
