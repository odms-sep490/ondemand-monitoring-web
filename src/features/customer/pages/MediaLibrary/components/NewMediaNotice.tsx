import { Alert } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { customerHref } from '../../../routes'
import { newMediaNoticeMessages } from './NewMediaNotice.messages'

export function NewMediaNotice({ count }: { count: number }) {
  const { t } = useI18n(newMediaNoticeMessages)
  if (count <= 0) return null
  return (
    <Alert
      type="info"
      showIcon
      role="status"
      message={t.text(count)}
      action={
        <a className="mgr-card-link" href={customerHref({ screen: 'notifications' })}>
          {t.view}
        </a>
      }
    />
  )
}
