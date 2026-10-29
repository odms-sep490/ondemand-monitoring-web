import { UploadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useId, useRef } from 'react'

import { useI18n } from '../../../shared/i18n'
import { pcBackupPickerMessages } from './PcBackupPicker.messages'

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
  const { t } = useI18n(pcBackupPickerMessages)
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="pc-backup">
      <label htmlFor={id} className="pc-backup__label">
        {t.label}
      </label>
      <input
        ref={input}
        id={id}
        type="file"
        accept={contentType}
        disabled={disabled}
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) onSelect(file)
        }}
      />
      <Button
        size="small"
        icon={<UploadOutlined />}
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        {t.choose}
      </Button>
    </div>
  )
}
