import { useState } from 'react'

import { Icon } from '../../../../../shared/components/Icon'
import { FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { CustomerOrderAttachment } from '../../../lib/createOrder/types'
import { airspaceNoticeMessages } from './AirspaceNotice.messages'

export const PERMIT_FILE_MAX_COUNT = 3
export const PERMIT_FILE_MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = '.pdf,application/pdf,image/*'

export function isSupportedPermitFile(file: Pick<File, 'name' | 'type'>) {
  return file.type === 'application/pdf' || file.type.startsWith('image/') || /\.pdf$/i.test(file.name)
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

type Props = {
  files: CustomerOrderAttachment[]
  error?: string
  onChange: (files: CustomerOrderAttachment[]) => void
}

/** The customer's flight-permit file(s); a permit number alone cannot be checked. */
export function PermitDocumentsField({ files, error, onChange }: Props) {
  const { t } = useI18n(airspaceNoticeMessages)
  const [dragging, setDragging] = useState(false)
  const [messages, setMessages] = useState<string[]>([])

  async function attach(input: FileList | File[] | null) {
    const list = input ? Array.from(input) : []
    if (!list.length) return
    const notes: string[] = []
    const next = new Map(files.map((item) => [item.id, item]))
    for (const file of list) {
      if (!isSupportedPermitFile(file)) {
        notes.push(t.permitFilesUnsupported(file.name))
        continue
      }
      if (file.size > PERMIT_FILE_MAX_BYTES) {
        notes.push(t.permitFilesTooLarge(file.name))
        continue
      }
      const id = `${file.name}-${file.size}-${file.lastModified}`
      if (!next.has(id) && next.size >= PERMIT_FILE_MAX_COUNT) {
        notes.push(t.permitFilesTooMany)
        break
      }
      try {
        next.set(id, {
          id,
          fileName: file.name,
          // Some browsers leave the type empty for PDFs; the server only accepts a real type.
          contentType: file.type || 'application/pdf',
          sizeBytes: file.size,
          dataUrl: await readDataUrl(file),
        })
      } catch {
        notes.push(t.permitFilesUnsupported(file.name))
      }
    }
    onChange(Array.from(next.values()))
    setMessages(notes)
  }

  return (
    <div>
      <FormField id="co-permit-files" label={t.permitFilesLabel} required error={error}>
        <div className="co-upload">
          <input
            id="co-permit-files"
            className="co-upload-input"
            type="file"
            accept={ACCEPT}
            multiple
            onChange={(event) => {
              void attach(event.target.files)
              event.currentTarget.value = ''
            }}
          />
          <label
            htmlFor="co-permit-files"
            className={`co-upload-zone${dragging ? ' is-dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              void attach(event.dataTransfer.files)
            }}
          >
            <span className="co-upload-line">
              <span className="co-upload-icon" aria-hidden="true">
                <Icon name="arrow-up" width={18} height={18} />
              </span>
              <span>
                {t.permitFilesDrop} <span className="co-upload-link">{t.permitFilesChoose}</span>
              </span>
            </span>
            <span className="co-upload-meta">{t.permitFilesMeta}</span>
          </label>
        </div>
      </FormField>
      <div className="co-help">{t.permitFilesHint}</div>
      {messages.length > 0 && (
        <ul className="co-help" role="status">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul className="co-attach-list">
          {files.map((file) => (
            <li key={file.id} className="co-attach-item">
              {file.contentType.startsWith('image/') ? <img src={file.dataUrl} alt={file.fileName} /> : null}
              <span className="co-attach-name" title={file.fileName}>
                {file.fileName}
              </span>
              <button
                type="button"
                className="co-attach-remove"
                aria-label={t.permitFilesRemove(file.fileName)}
                title={t.permitFilesRemove(file.fileName)}
                onClick={() => onChange(files.filter((item) => item.id !== file.id))}
              >
                <Icon name="x" width={14} height={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
