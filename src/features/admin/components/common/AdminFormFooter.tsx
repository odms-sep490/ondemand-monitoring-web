import { Button } from 'antd'

import { defineMessages, useI18n } from '../../../../shared/i18n'

const adminFormFooterMessages = defineMessages({
  vi: { cancel: 'Huỷ', save: 'Lưu', saving: 'Đang lưu...' },
  en: { cancel: 'Cancel', save: 'Save', saving: 'Saving...' },
})

/** Cancel + submit pair for an antd Modal footer, bound to a form by id. */
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
      <Button type="primary" htmlType="submit" form={formId} loading={busy}>
        {busy ? t.saving : t.save}
      </Button>
    </>
  )
}
