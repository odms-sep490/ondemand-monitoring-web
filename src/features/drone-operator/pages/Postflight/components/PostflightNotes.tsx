import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'

export function PostflightNotes({
  notes,
  setNotes,
}: {
  notes: string
  setNotes: Dispatch<SetStateAction<string>>
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <section className="postflight-notes">
      <h2 className="postflight-notes-heading">{t.notesLabel}</h2>
      <div className="postflight-notes-body">
        <textarea
          className="postflight-notes-input"
          rows={3}
          aria-label={t.notesLabel}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPlaceholder}
        />
      </div>
    </section>
  )
}
