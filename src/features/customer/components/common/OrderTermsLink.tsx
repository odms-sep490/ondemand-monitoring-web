import { useState } from 'react'
import { Button, Modal } from 'antd'
import { defineMessages, useI18n } from '../../../../shared/i18n'
import { deliveryOptionsCardMessages } from '../../pages/CreateOrder/components/DeliveryOptionsCard.messages'

const messages = defineMessages({
  vi: { view: 'Xem điều khoản', close: 'Đóng' },
  en: { view: 'View terms', close: 'Close' },
})

export function OrderTermsLink() {
  const [open, setOpen] = useState(false)
  const { t } = useI18n(messages)
  const { t: terms } = useI18n(deliveryOptionsCardMessages)
  return <>
    <Button type="link" size="small" style={{ paddingInline: 0 }} onClick={() => setOpen(true)}>{t.view}</Button>
    <Modal title={terms.termsHeading} open={open} onCancel={() => setOpen(false)}
      footer={<Button onClick={() => setOpen(false)}>{t.close}</Button>} width={720}>
      <p>{terms.termsLabel}</p>
      <p>{terms.termsPrivacyNotice}</p>
      <ul style={{ paddingInlineStart: 20, lineHeight: 1.7 }}>
        {[terms.commitmentUse, terms.commitmentRetention, terms.commitmentResponsibility, terms.commitmentPermit, terms.commitmentPrivacy].map(content =>
          <li key={content} style={{ marginBottom: 12 }}>{content}</li>)}
      </ul>
    </Modal>
  </>
}
