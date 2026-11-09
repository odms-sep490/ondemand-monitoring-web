import { Button } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { customerHref } from '../../../routes'
import { submitBarMessages } from './SubmitBar.messages'

type Props = { error: string | null; disabled: boolean; onSubmit: () => void }

export function SubmitBar({ error, disabled, onSubmit }: Props) {
  const { t } = useI18n(submitBarMessages)
  return (
    <>
      {error && (
        <div className="co-notice is-danger" role="alert">
          {error}
        </div>
      )}
      <div className="co-footer">
        <Button href={customerHref({ screen: 'orders' })}>{t.cancel}</Button>
        <div className="co-footer-spacer" />
        <Button type="primary" disabled={disabled} onClick={onSubmit}>
          {t.submit}
        </Button>
      </div>
    </>
  )
}
