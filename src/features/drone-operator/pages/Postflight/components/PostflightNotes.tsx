import { Input } from 'antd'
import type { Dispatch, SetStateAction } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { postflightPageMessages } from '../PostflightPage.messages'

export function PostflightNotes({
  notes,
  setNotes,
}: {
  notes: string
  setNotes: Dispatch<SetStateAction<string>>
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <CardComponent>
      <label
        htmlFor="postflight-notes"
        style={{
          display: 'block',
          marginBottom: 8,
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {t.notesLabel}
      </label>
      <Input.TextArea
        id="postflight-notes"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t.notesPlaceholder}
      />
    </CardComponent>
  )
}
