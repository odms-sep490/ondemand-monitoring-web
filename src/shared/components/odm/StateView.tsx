import type { ReactNode } from 'react'

import { ApiError } from '../../api/httpClient'
import { useI18n } from '../../i18n'
import { stateViewMessages } from './StateView.messages'

type LoadingStateProps = {
  label?: string
}

/** Loading state: skeleton lines + `aria-busy`, per [TK MNG-01]. */
export function LoadingState({ label }: LoadingStateProps) {
  const { t } = useI18n(stateViewMessages)
  const resolvedLabel = label ?? t.loading
  return (
    <div className="odm-card" aria-busy="true" aria-live="polite">
      <div
        className="odm-card-body"
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <span
          className="odm-sk"
          style={{ width: '60%', height: 12, display: 'block' }}
        />
        <span
          className="odm-sk"
          style={{ width: '40%', height: 28, display: 'block' }}
        />
        <span
          className="odm-sk"
          style={{ width: '80%', height: 12, display: 'block' }}
        />
        <span className="odm-visually-hidden">{resolvedLabel}</span>
      </div>
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

/** Empty state: title + description + optional action, per [TK MNG-02]. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="odm-card">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 10,
          padding: '110px 24px',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'var(--sf3)',
            color: 'var(--tx3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        {description ? (
          <div style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}>
            {description}
          </div>
        ) : null}
        {action ? <div style={{ marginTop: 6 }}>{action}</div> : null}
      </div>
    </div>
  )
}

type ErrorStateProps = {
  title?: string
  error: ApiError | Error | unknown
  onRetry?: () => void
}

function describeError(error: unknown, genericError: string) {
  if (error instanceof ApiError) {
    return {
      description:
        error.code === 'NETWORK_ERROR'
          ? genericError
          : error.message || genericError,
      debugLine: `${error.method} ${error.path}${
        error.status ? ` · ${error.status}` : ''
      }`,
    }
  }
  if (error instanceof Error) {
    return { description: error.message, debugLine: undefined }
  }
  return {
    description: genericError,
    debugLine: undefined,
  }
}

/**
 * Error state: title, description, mono `METHOD /path · status` debug line
 * when the error is an `ApiError`, and a "Thử lại" retry button — matches
 * the error card in [TK MNG-01].
 */
export function ErrorState({ title, error, onRetry }: ErrorStateProps) {
  const { t } = useI18n(stateViewMessages)
  const resolvedTitle = title ?? t.errorTitle
  const { description, debugLine } = describeError(error, t.genericError)
  return (
    <div className="odm-card">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 10,
          padding: '110px 24px',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'var(--red-bg)',
            color: 'var(--red-fg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3.5l10 17.5H2z" />
            <path d="M12 10v5M12 18v.4" />
          </svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{resolvedTitle}</div>
        <div style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}>
          {description}
        </div>
        {debugLine ? (
          <div
            className="odm-mono"
            style={{
              fontSize: 11.5,
              color: 'var(--tx3)',
              background: 'var(--sf3)',
              padding: '3px 8px',
              borderRadius: 5,
            }}
          >
            {debugLine}
          </div>
        ) : null}
        {onRetry ? (
          <div style={{ marginTop: 6 }}>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={onRetry}
            >
              {t.retry}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

type StateViewProps =
  | ({ state: 'loading' } & LoadingStateProps)
  | ({ state: 'empty' } & EmptyStateProps)
  | ({ state: 'error' } & ErrorStateProps)

/**
 * Single entry point that dispatches to `LoadingState` / `EmptyState` /
 * `ErrorState` based on `state`. Use the individual components directly when
 * a screen needs more control over layout.
 */
export function StateView(props: StateViewProps) {
  if (props.state === 'loading') return <LoadingState label={props.label} />
  if (props.state === 'empty')
    return (
      <EmptyState
        title={props.title}
        description={props.description}
        action={props.action}
      />
    )
  return (
    <ErrorState
      title={props.title}
      error={props.error}
      onRetry={props.onRetry}
    />
  )
}
