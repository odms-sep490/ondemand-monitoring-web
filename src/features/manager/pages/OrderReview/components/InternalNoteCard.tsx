import { useState } from 'react'

import { env } from '../../../../../config/env'
import { ordersApi } from '../../../api/ordersApi'
import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import { formatVn } from '../../../components/common/format'
import { OrderIcon } from '../../../components/common/OrderIcon'

const NOTE_MAX_LENGTH = 500

export function InternalNoteCard({
  orderId,
  t,
  locale,
}: {
  orderId: string
  t: OrderReviewMessages
  locale: 'vi-VN' | 'en-US'
}) {
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState<{
    note: string
    authorName: string
    updatedAt: string
  } | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )

  async function handleSave() {
    setStatus('saving')
    try {
      const result = await ordersApi.saveInternalNote(orderId, draft)
      setSaved(result)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  const saveDisabledByBackend =
    !env.useMockApi && import.meta.env.MODE !== 'test'

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="doc" size={18} />
          {t.internalNote}
        </span>
      </header>
      <div className="odm-or-card-body odm-or-note">
        {saved ? (
          <div className="odm-or-note-existing">
            <div className="odm-or-note-meta">
              {saved.authorName} · {formatVn(saved.updatedAt, locale)}
            </div>
            {saved.note}
          </div>
        ) : null}
        <textarea
          className="odm-or-textarea"
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          placeholder={t.internalNotePlaceholder}
          aria-label={t.internalNote}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setStatus('idle')
          }}
        />
        <div className="odm-or-note-foot">
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            disabled={
              saveDisabledByBackend ||
              draft.trim().length === 0 ||
              status === 'saving'
            }
            title={saveDisabledByBackend ? t.internalNoteDisabled : undefined}
            onClick={handleSave}
          >
            {t.saveNote}
          </button>
          <span className="odm-or-note-status" aria-live="polite">
            {status === 'saving' ? t.saving : null}
            {status === 'saved' ? t.saved : null}
            {status === 'error' ? (
              <span className="odm-or-note-error">{t.saveFailed}</span>
            ) : null}
          </span>
          <span className="odm-or-note-counter">
            {draft.length}/{NOTE_MAX_LENGTH}
          </span>
        </div>
      </div>
    </section>
  )
}
