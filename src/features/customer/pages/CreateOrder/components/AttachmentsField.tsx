import { useState } from 'react'

import { Icon } from '../../../../../shared/components/Icon'
import { FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  CustomerOrderAttachment,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
import { attachmentsFieldMessages } from './AttachmentsField.messages'

function readImageAttachment(file: File): Promise<CustomerOrderAttachment> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('INVALID_IMAGE'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        dataUrl: String(reader.result ?? ''),
      })
    }
    reader.onerror = () => reject(reader.error ?? new Error('READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

type Props = {
  attachments: FormState['attachments']
  update: UpdateField
}

/** Optional reference images; stored in `form.attachments` and sent with the order payload. */
export function AttachmentsField({ attachments, update }: Props) {
  const { t } = useI18n(attachmentsFieldMessages)
  const [dragging, setDragging] = useState(false)

  async function attach(files: FileList | File[] | null) {
    const list = files ? Array.from(files) : []
    if (!list.length) return
    try {
      const added = await Promise.all(list.map(readImageAttachment))
      const existing = new Map(attachments.map((item) => [item.id, item]))
      for (const attachment of added) existing.set(attachment.id, attachment)
      update('attachments', Array.from(existing.values()))
    } catch {
      window.alert(t.invalidImage)
    }
  }

  return (
    <div>
      <FormField id="co-attachments" label={t.label}>
        <p className="co-hint">{t.hint}</p>
        <div className="co-upload">
          <input
            id="co-attachments"
            className="co-upload-input"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              void attach(event.target.files)
              event.currentTarget.value = ''
            }}
          />
          <label
            htmlFor="co-attachments"
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
                {t.drop} <span className="co-upload-link">{t.choose}</span>
              </span>
            </span>
            <span className="co-upload-meta">{t.meta}</span>
          </label>
        </div>
      </FormField>
      {attachments.length > 0 && (
        <ul className="co-attach-list">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="co-attach-item">
              <img src={attachment.dataUrl} alt={attachment.fileName} />
              <span className="co-attach-name" title={attachment.fileName}>
                {attachment.fileName}
              </span>
              <button
                type="button"
                className="co-attach-remove"
                aria-label={t.removeNamed(attachment.fileName)}
                title={t.remove}
                onClick={() =>
                  update(
                    'attachments',
                    attachments.filter((item) => item.id !== attachment.id),
                  )
                }
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
