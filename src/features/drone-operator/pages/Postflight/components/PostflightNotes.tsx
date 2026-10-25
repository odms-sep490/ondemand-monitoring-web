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
    <div
      style={{
        background: 'var(--sf, #fff)',
        border: '1.5px solid var(--bd, #e2e8f0)',
        borderRadius: 14,
        padding: 16,
      }}
    >
      <label
        style={{
          fontWeight: 700,
          fontSize: 14,
          display: 'block',
          marginBottom: 8,
        }}
      >
        {t.notesLabel}
      </label>
      <textarea
        className="odm-input"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t.notesPlaceholder}
        style={{
          width: '100%',
          resize: 'vertical',
          borderRadius: 8,
          padding: 10,
        }}
      />
    </div>
  )
}
