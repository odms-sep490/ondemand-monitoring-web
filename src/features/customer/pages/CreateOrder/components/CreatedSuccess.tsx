import './CreatedSuccess.css'
import { Button } from 'antd'
import { useEffect } from 'react'
import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import { createAssistantVoiceUtterance } from '../../../../../shared/lib/assistantVoice'
import { customerHref } from '../../../routes'
import { createdSuccessMessages } from './CreatedSuccess.messages'
import { AIAnimatedMascot } from './AIAnimatedMascot'

export function CreatedSuccess({
  orderId,
  orderCode,
  assistantSuccess = false,
}: {
  orderId: string
  orderCode?: string | null
  assistantSuccess?: boolean
}) {
  const { t, lang } = useI18n(createdSuccessMessages)
  const assistantMessage = lang === 'vi'
    ? `Yêu cầu giám sát đã được tạo thành công. Mã yêu cầu của bạn là ${orderCode ?? orderId}. Bạn có thể mở chi tiết đơn để theo dõi.`
    : `Your monitoring request was created successfully. Your request code is ${orderCode ?? orderId}. You can open the request to track it.`
  async function speakSuccess() {
    const utterance = await createAssistantVoiceUtterance(assistantMessage)
    if (utterance) window.speechSynthesis.speak(utterance)
  }
  useEffect(() => {
    if (assistantSuccess && lang === 'vi') void speakSuccess()
    return () => window.speechSynthesis?.cancel()
  }, [assistantSuccess, lang, orderCode, orderId])
  return (
    <div className="co-success-page"><section className="co-success co-success-card" role="status">
      <div className="co-success-icon" aria-hidden="true">
        <Icon name="check" width={28} height={28} />
      </div>
      <h2>{t.title}</h2>
      <p className="co-hint">{t.description}</p>
      <div className="co-success-reference"><span>{t.orderCode}</span><strong>{orderCode ?? orderId}</strong></div>
      {assistantSuccess && <div className="co-success-assistant" role="status">
        <AIAnimatedMascot state="success" size="avatar" />
        <p><strong>{lang === 'vi' ? 'Trợ lý AI' : 'AI assistant'}</strong><br />{assistantMessage}</p>
        {lang === 'vi' && <Button onClick={() => void speakSuccess()}>Nghe lại</Button>}
      </div>}
      <Button href={customerHref({ screen: 'orderDetail', orderId })} type="primary">
        {lang === 'vi' ? 'Xem yêu cầu vừa tạo' : 'View your request'}
      </Button>
    </section></div>
  )
}
