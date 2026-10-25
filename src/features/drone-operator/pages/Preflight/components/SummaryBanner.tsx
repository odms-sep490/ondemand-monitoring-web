import type { PreflightItemDef } from './PreflightItem'
import { useI18n } from '../../../../../shared/i18n'
import { preflightPageMessages } from '../PreflightPage.messages'
import { operatorHref } from '../../../routes'

export function SummaryBanner({
  nOk,
  nTotal,
  progress,
  isReady,
  isFailed,
  failedItems,
  error,
  hasTriggered,
  triggering,
  onTrigger,
  onReady,
  missionId,
  backendPreflightMessage,
  backendPreflightRegistering,
}: {
  nOk: number
  nTotal: number
  progress: number
  isReady: boolean
  isFailed: boolean
  failedItems: PreflightItemDef[]
  error: string | null
  hasTriggered: boolean
  triggering: boolean
  onTrigger: () => void
  onReady?: () => void
  missionId: string
  backendPreflightMessage?: string | null
  backendPreflightRegistering?: boolean
}) {
  const { t } = useI18n(preflightPageMessages)
  const bg = isFailed
    ? 'var(--red-bg)'
    : isReady
      ? 'var(--green-bg)'
      : 'var(--sf)'
  const border = isFailed
    ? 'var(--red-dot)'
    : isReady
      ? 'var(--green-dot)'
      : 'var(--bd)'
  const fg = isFailed
    ? 'var(--red-fg)'
    : isReady
      ? 'var(--green-fg)'
      : 'var(--tx)'

  return (
    <div
      style={{
        display: 'flex',
        gap: 18,
        alignItems: 'center',
        padding: '12px 18px',
        borderRadius: 14,
        background: bg,
        border: `1.5px solid ${border}`,
        color: fg,
      }}
    >
      <div style={{ minWidth: 150 }}>
        <div
          className="odm-mono"
          style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}
        >
          {nOk}/{nTotal}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.itemsPassed}</div>
      </div>
      <div style={{ flex: 1 }}>
        {isReady ? (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{t.passReady}</div>
            {backendPreflightMessage ? (
              <div style={{ fontSize: 12.5, marginTop: 4 }}>
                {backendPreflightMessage}
              </div>
            ) : null}
          </div>
        ) : isFailed ? (
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {t.failBlocked(failedItems.map((item) => item.label).join(', '))}
          </div>
        ) : (
          <div style={{ fontSize: 13.5 }}>
            {error ??
              (hasTriggered ? t.runningPrecheck(progress) : t.pressTriggerHint)}
          </div>
        )}
      </div>
      {isReady ? (
        onReady ? (
          <button
            type="button"
            className="odm-btn odm-btn-ok"
            onClick={onReady}
            disabled={backendPreflightRegistering}
            style={{ minWidth: 220 }}
          >
            {backendPreflightRegistering
              ? t.switchingToReady
              : t.continueToHandover}
          </button>
        ) : (
          <a
            className="odm-btn odm-btn-ok"
            href={operatorHref({ screen: 'missionDetail', missionId })}
            style={{ minWidth: 220 }}
          >
            {t.continueToHandover}
          </a>
        )
      ) : isFailed ? (
        <button
          type="button"
          className="odm-btn odm-btn-rd"
          onClick={onTrigger}
          disabled={triggering}
          style={{ minWidth: 200 }}
        >
          {triggering ? t.triggeringAgain : t.triggerAgain}
        </button>
      ) : !hasTriggered || error ? (
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={onTrigger}
          disabled={triggering}
          style={{ minWidth: 220 }}
        >
          {triggering ? t.triggeringAgain : t.triggerPrecheck}
        </button>
      ) : (
        <button
          type="button"
          className="odm-btn"
          disabled
          style={{ minWidth: 220 }}
        >
          {t.continueToHandover}
        </button>
      )}
    </div>
  )
}
