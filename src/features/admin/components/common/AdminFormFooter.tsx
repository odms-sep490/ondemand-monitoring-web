import { Button } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { adminFormFooterMessages } from './AdminFormFooter.messages'

/** Cancel + submit pair for a modal whose `<form id>` lives in the body. */
export function AdminFormFooter({
  formId,
  busy,
  onClose,
}: {
  formId: string
  busy: boolean
  onClose: () => void
}) {
  const { t } = useI18n(adminFormFooterMessages)
  return (
    <>
      <Button onClick={onClose}>{t.cancel}</Button>
      <Button type="primary" htmlType="submit" form={formId} disabled={busy}>
        {busy ? t.saving : t.save}
      </Button>
    </>
  )
}
