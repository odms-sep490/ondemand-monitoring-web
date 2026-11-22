import { useEffect, useId, useRef, useState } from 'react'
import { Alert, Button, Input, Modal, Spin } from 'antd'
import { ArrowRightOutlined, BulbOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons'
import { ApiError, apiRequest } from '../../../../shared/api/httpClient'
import type { CustomerQuoteSelection } from '../../../../shared/api/checklistPricingApi'
import { useI18n } from '../../../../shared/i18n'
import { requestAssistantMessages } from './RequestServiceAssistant.messages'
import './RequestServiceAssistant.css'

type Answer = { status: string; answer?: string }

/** Read-only guidance, reset by ContentStep whenever the pricing selection changes. */
export function RequestServiceAssistant({ selection, onSelectionInvalid }: {
  selection: CustomerQuoteSelection | null
  onSelectionInvalid?: () => void
}) {
  const { t } = useI18n(requestAssistantMessages)
  const questionId = useId()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState('')
  const [answer, setAnswer] = useState('')
  const plainAnswer = answer.replaceAll('**', '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [selectionInvalid, setSelectionInvalid] = useState(false)
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])

  function close() {
    pending.current?.abort()
    setBusy(false)
    setOpen(false)
  }

  async function ask(text: string) {
    if (!selection || !text.trim() || busy || selectionInvalid) return
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    setError('')
    setAnswer('')
    setAsked(text.trim())
    try {
      const result = await apiRequest<Answer>('/api/customer/request-assistant/messages', {
        method: 'POST', body: { question: text.trim(), selection }, signal: controller.signal,
      })
      if (controller.signal.aborted) return
      if (result.status === 'READY' && result.answer) setAnswer(result.answer)
      else setError(result.status === 'BUSY' ? t.busy : t.unavailable)
    } catch (cause) {
      if (controller.signal.aborted) return
      if (cause instanceof ApiError && (cause.code === 'SERVICE_NOT_FOUND' || cause.code === 'SERVICE_INACTIVE')) {
        setSelectionInvalid(true)
        setError(t.selectionChanged)
      } else {
        setError(t.unavailable)
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return <>
    <button type="button" className="cus-service-ai" onClick={() => setOpen(true)}>
      <span className="cus-service-ai-icon"><BulbOutlined aria-hidden /></span>
      <span className="cus-service-ai-copy"><strong>{t.title}</strong><small>{t.hint}</small></span>
      <span className="cus-service-ai-open">{t.open}<ArrowRightOutlined aria-hidden /></span>
    </button>
    <Modal title={<span className="cus-service-ai-title"><MessageOutlined aria-hidden />{t.title}</span>}
      open={open} onCancel={close} footer={null} width={580} centered destroyOnHidden className="cus-service-ai-modal">
      <div className="cus-service-ai-body">
        <p className="cus-service-ai-context">{t.context}</p>
        {!selection ? <Alert type="info" showIcon message={t.choose} /> : <>
          <strong>{t.intro}</strong>
          <div className="cus-service-ai-suggestions">
            {t.suggestions.map(text => <Button key={text} disabled={busy || selectionInvalid} onClick={() => { setQuestion(text); void ask(text) }}>{text}</Button>)}
          </div>
          <label htmlFor={questionId}>{t.label}</label>
          <Input.TextArea id={questionId} value={question} onChange={event => setQuestion(event.target.value)}
            placeholder={t.placeholder} maxLength={1500} rows={3} disabled={busy || selectionInvalid} />
          <Button className="cus-service-ai-send" type="primary" icon={<SendOutlined aria-hidden />} loading={busy}
            disabled={busy || selectionInvalid || !question.trim()} onClick={() => void ask(question)}>{t.send}</Button>
          {busy && <div className="cus-service-ai-loading" role="status"><Spin size="small" />{t.thinking}</div>}
          {error && <Alert type="warning" showIcon message={error} action={selectionInvalid
            ? <Button size="small" onClick={() => { close(); if (onSelectionInvalid) onSelectionInvalid(); else window.location.reload() }}>{t.reselect}</Button>
            : <Button size="small" onClick={() => void ask(asked)}>{t.retry}</Button>} />}
          {answer && <section className="cus-service-ai-answer" aria-live="polite">
            <small>{asked}</small><strong><BulbOutlined aria-hidden />{t.answer}</strong><p>{plainAnswer}</p>
          </section>}
        </>}
        <small className="cus-service-ai-note">{t.note}</small>
      </div>
    </Modal>
  </>
}
