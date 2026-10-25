import { useState, useRef, useEffect } from 'react'

import { useI18n } from '../../../shared/i18n'
import { chatbotWidgetMessages, kbPatterns } from './ChatbotWidget.messages'

type Msg = { text: string; from: 'user' | 'bot' }

export function ChatbotWidget() {
  const { t, lang } = useI18n(chatbotWidgetMessages)
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ text: t.greeting, from: 'bot' }])
  const [input, setInput] = useState('')
  const msgsRef = useRef<HTMLDivElement>(null)
  const replyTimers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const openButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  // Chat history contains localized bot replies. Clear it on locale changes so
  // the open conversation never displays a mixture of languages.
  useEffect(() => {
    replyTimers.current.forEach(clearTimeout)
    replyTimers.current.clear()
    setMsgs([{ text: t.greeting, from: 'bot' }])
    setInput('')
    return () => {
      replyTimers.current.forEach(clearTimeout)
      replyTimers.current.clear()
    }
  }, [lang, t.greeting])

  useEffect(() => {
    if (msgsRef.current)
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs])

  useEffect(() => {
    if (open) closeButton.current?.focus()
    else if (wasOpen.current) openButton.current?.focus()
    wasOpen.current = open
  }, [open])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  function answer(text: string) {
    let reply = t.defaultMessage
    for (let i = 0; i < kbPatterns.length; i++) {
      if (kbPatterns[i].test(text)) {
        reply = t.responses[i]
        break
      }
    }
    setMsgs((prev) => [...prev, { text, from: 'user' }])
    const timer = setTimeout(() => {
      replyTimers.current.delete(timer)
      setMsgs((prev) => [...prev, { text: reply, from: 'bot' }])
    }, 450)
    replyTimers.current.add(timer)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    answer(input.trim())
    setInput('')
  }

  if (open) {
    return (
      <div className="lp-bot">
        <div
          className="lp-bot-win"
          role="dialog"
          aria-modal="false"
          aria-label={t.assistantName}
        >
          <div className="lp-bot-header">
            <img
              src="/images/logo-new.png"
              alt=""
              className="lp-bot-header-avatar"
            />
            <div>
              <b>{t.assistantName}</b>
              <small>{t.onlineStatus}</small>
            </div>
            <button
              className="lp-bot-close"
              ref={closeButton}
              type="button"
              aria-label={t.close}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <div
            className="lp-bot-msgs"
            ref={msgsRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {msgs.map((m, i) => (
              <div key={i} className={`lp-bot-msg lp-bot-msg--${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="lp-bot-chips">
            {t.chips.map((s) => (
              <button key={s} type="button" onClick={() => answer(s)}>
                {s}
              </button>
            ))}
          </div>
          <form className="lp-bot-form" onSubmit={handleSubmit}>
            <input
              aria-label={t.inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              autoComplete="off"
            />
            <button type="submit">{t.send}</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="lp-bot">
      <div className="lp-bot-hint">{t.hint}</div>
      <button
        className="lp-bot-fab"
        ref={openButton}
        type="button"
        onClick={() => setOpen(true)}
      >
        <img src="/images/logo-new.png" alt={t.fabAriaLabel} />
        <span className="lp-bot-dot" />
      </button>
    </div>
  )
}
