import type { PreflightItemDef } from './PreflightItem'
import { useI18n } from '../../../../../shared/i18n'
import { preflightPageMessages } from '../PreflightPage.messages'
import { operatorHref } from '../../../routes'
import { humanizePreflightDisplayText } from '../preflightHelpers'
import './PreflightChecklist.css'

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
  readyActionLabel,
  onReady,
  missionId,
  backendPreflightRegistering,
  replacementRequesting,
  replacementRequested,
  replacementRequestError,
  onRequestDroneReplacement,
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
  readyActionLabel?: string
  onReady?: () => void
  missionId: string
  backendPreflightMessage?: string | null
  backendPreflightRegistering?: boolean
  replacementRequesting: boolean
  replacementRequested: boolean
  replacementRequestError: string | null
  onRequestDroneReplacement: () => void
}) {
  const { t, lang } = useI18n(preflightPageMessages)
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
      className={isReady ? 'preflight-summary-banner' : undefined}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 18,
        alignItems: 'center',
        padding: '12px 18px',
        borderRadius: 14,
        background: isReady ? undefined : bg,
        border: `1.5px solid ${border}`,
        color: fg,
      }}
    >
      <div
        className={isReady ? 'preflight-summary-banner__result' : undefined}
        style={{ minWidth: 150 }}
      >
        {isReady && (
          <span className="preflight-summary-banner__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m5 12.5 4.2 4.2L19.5 6.8" />
            </svg>
          </span>
        )}
        <div
          className="odm-mono"
          data-slot="result-count"
          style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}
        >
          {nOk}/{nTotal}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.itemsPassed}</div>
      </div>
      <div
        className={isReady ? 'preflight-summary-banner__message' : undefined}
        style={{ flex: 1 }}
      >
        {isReady ? (
          <div>
            <div className="preflight-summary-banner__title">{readyActionLabel && readyActionLabel !== t.continueToHandover ? (lang === 'vi' ? 'Thiết bị này đã đạt kiểm tra' : 'This drone passed inspection') : t.passReady}</div>
            <div className="preflight-summary-banner__description">
              {t.passDescription}
            </div>
          </div>
        ) : isFailed ? (
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {t.failBlocked(failedItems.map((item) => item.label).join(', '))}
            {replacementRequestError ? (
              <div
                role="alert"
                style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}
              >
                {humanizePreflightDisplayText(replacementRequestError)}
              </div>
            ) : replacementRequested ? (
              <div
                role="status"
                style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}
              >
                {t.droneReplacementRequestSent}
              </div>
            ) : null}
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
            className="preflight-summary-banner__button"
            onClick={onReady}
            disabled={backendPreflightRegistering}
            aria-busy={backendPreflightRegistering}
          >
            <svg
              className="preflight-summary-banner__play"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M9 6.75v10.5L18 12 9 6.75Z" fill="currentColor" />
            </svg>
            {backendPreflightRegistering
              ? t.switchingToReady
              : (readyActionLabel ?? t.continueToHandover)}
            {!backendPreflightRegistering && (
              <svg
                className="preflight-summary-banner__arrow"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M4.5 12h14m-6-6 6 6-6 6" />
              </svg>
            )}
          </button>
        ) : (
          <a
            className="preflight-summary-banner__button"
            href={operatorHref({ screen: 'missionDetail', missionId })}
          >
            <svg
              className="preflight-summary-banner__play"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M9 6.75v10.5L18 12 9 6.75Z" fill="currentColor" />
            </svg>
            {t.continueToHandover}
            <svg
              className="preflight-summary-banner__arrow"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M4.5 12h14m-6-6 6 6-6 6" />
            </svg>
          </a>
        )
      ) : isFailed ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'flex-end',
          }}
        >
          {!replacementRequested && (
            <button
              type="button"
              className="odm-btn odm-btn-rd"
              onClick={onTrigger}
              disabled={triggering}
              style={{ minWidth: 180 }}
            >
              {triggering ? t.triggeringAgain : t.triggerAgain}
            </button>
          )}
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={onRequestDroneReplacement}
            disabled={replacementRequesting || replacementRequested}
            style={{ minWidth: 210 }}
          >
            {replacementRequesting
              ? t.requestingDroneReplacement
              : replacementRequested
                ? t.droneReplacementRequestSentShort
                : t.requestDroneReplacement}
          </button>
        </div>
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
      ) : null}
    </div>
  )
}
