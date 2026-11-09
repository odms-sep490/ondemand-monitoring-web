import { Button } from './Button'
import { useI18n } from '../../i18n'
import { defineMessages } from '../../i18n'

const formFooterMessages = defineMessages({
  vi: { cancel: 'Huỷ', save: 'Lưu', saving: 'Đang lưu...' },
  en: { cancel: 'Cancel', save: 'Save', saving: 'Saving...' },
})

export function FormFooter({
  formId,
  busy,
  onClose,
}: {
  formId: string
  busy: boolean
  onClose: () => void
}) {
  const { t } = useI18n(formFooterMessages)
  return (
    <>
      <Button variant="ghost" onClick={onClose}>
        {t.cancel}
      </Button>
      <Button type="submit" form={formId} variant="primary" disabled={busy}>
        {busy ? t.saving : t.save}
      </Button>
    </>
  )
}
