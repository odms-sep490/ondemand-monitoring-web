import { useId, useRef } from 'react'
import { defineMessages, useI18n } from '../../../shared/i18n'
const messages = defineMessages({
  vi: {
    choose: 'Chọn tệp sao lưu',
    label: 'Khôi phục bằng bản sao từ máy tính (phải khớp SHA-256 bản gốc)',
  },
  en: {
    choose: 'Choose backup file',
    label: 'Recover from a computer backup (must match the original SHA-256)',
  },
})

export function PcBackupPicker({
  contentType,
  disabled,
  onSelect,
}: {
  contentType: string
  disabled: boolean
  onSelect: (file: File) => void
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const { t } = useI18n(messages)
  return (
    <div style={{ marginTop: 10 }}>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 12, marginBottom: 6 }}
      >
        {t.label}
      </label>
      <input
        hidden
        ref={input}
        id={id}
        type="file"
        accept={contentType}
        disabled={disabled}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) onSelect(file)
        }}
      />
      <button
        type="button"
        className="odm-btn"
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        {t.choose}
      </button>
    </div>
  )
}
