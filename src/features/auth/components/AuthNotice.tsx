import { Icon } from '../../../shared/components/Icon'
import type { Notice } from '../types/authMode'

function getNoticeIcon(type: Notice['type']) {
  if (type === 'success') return 'check' as const
  if (type === 'error') return 'x' as const
  return 'activity' as const
}

export function AuthNotice({ notice }: { notice: Notice }) {
  return (
    <output
      className={`auth-notice auth-notice--${notice.type}`}
      aria-live="polite"
    >
      <Icon name={getNoticeIcon(notice.type)} />
      <span>
        <p>{notice.message}</p>
        {notice.detail ? <p>{notice.detail}</p> : null}
      </span>
    </output>
  )
}
