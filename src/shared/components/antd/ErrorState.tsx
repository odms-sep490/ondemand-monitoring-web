import { WarningOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ReactNode } from 'react'

import { ApiError } from '../../api/httpClient'
import { stateViewMessages } from '../odm/StateView.messages'
import { useI18n } from '../../i18n'
import { CardComponent } from './CardComponent'
import { EmptyState } from './EmptyState'

type Props = {
  title?: string
  error?: unknown
  /** Overrides the description derived from `error`. */
  description?: ReactNode
  onRetry?: () => void
  action?: ReactNode
}

/** Card-style load error with a retry button; mirrors the shared StateView error copy. */
export function ErrorState({ title, error, description, onRetry, action }: Props) {
  const { t } = useI18n(stateViewMessages)
  let message: ReactNode = description
  let debugLine: string | undefined
  if (!message) {
    if (error instanceof ApiError) {
      message = error.code === 'NETWORK_ERROR' ? t.genericError : error.message || t.genericError
      debugLine = `${error.method} ${error.path}${error.status ? ` · ${error.status}` : ''}`
    } else if (error instanceof Error) {
      message = error.message
    } else {
      message = t.genericError
    }
  }
  return (
    <CardComponent role="alert" styles={{ body: { padding: 0 } }}>
      <EmptyState
        art={false}
        title={
          <>
            <WarningOutlined className="mgr-empty-icon is-danger" aria-hidden="true" />
            <span>{title ?? t.errorTitle}</span>
          </>
        }
        description={
          <>
            {message}
            {debugLine && import.meta.env.DEV ? <code className="mgr-empty-debug">{debugLine}</code> : null}
          </>
        }
        action={
          action ??
          (onRetry ? (
            <Button type="primary" onClick={onRetry}>
              {t.retry}
            </Button>
          ) : undefined)
        }
      />
    </CardComponent>
  )
}
