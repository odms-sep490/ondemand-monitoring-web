import { useState } from 'react'

import { Icon } from '../../../../../shared/components/Icon'
import { FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import { parseAreaFile, type ParsedArea } from '../../../lib/createOrder/areaFile'
import type { CustomerOrderAttachment } from '../../../lib/createOrder/types'
import { areaFilesFieldMessages } from './AreaFilesField.messages'

export const AREA_FILE_MAX_COUNT = 5
export const AREA_FILE_MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = '.kml,.geojson,.json,.pdf,.dxf,image/*'
const GEO_EXT = /\.(kml|geojson|json)$/i
const OTHER_EXT = /\.(pdf|dxf)$/i

const CONTENT_TYPES: Record<string, string> = {
  kml: 'application/vnd.google-earth.kml+xml',
  geojson: 'application/geo+json',
  json: 'application/json',
  pdf: 'application/pdf',
  dxf: 'application/dxf',
}

export function isSupportedAreaFile(file: Pick<File, 'name' | 'type'>) {
  return GEO_EXT.test(file.name) || OTHER_EXT.test(file.name) || file.type.startsWith('image/')
}

function readFile(file: File, mode: 'text' | 'dataUrl'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('READ_FAILED'))
    if (mode === 'text') reader.readAsText(file)
    else reader.readAsDataURL(file)
  })
}

type Props = {
  files: CustomerOrderAttachment[]
  onChange: (files: CustomerOrderAttachment[]) => void
  onParsed: (area: ParsedArea) => void
}

/** KML / GeoJSON / drawing uploads; geo files also position the monitoring area. */
export function AreaFilesField({ files, onChange, onParsed }: Props) {
  const { t } = useI18n(areaFilesFieldMessages)
  const [dragging, setDragging] = useState(false)
  const [messages, setMessages] = useState<string[]>([])

  async function attach(input: FileList | File[] | null) {
    const list = input ? Array.from(input) : []
    if (!list.length) return
    const notes: string[] = []
    const next = new Map(files.map((item) => [item.id, item]))
    let parsed: { name: string; area: ParsedArea } | null = null

    for (const file of list) {
      if (!isSupportedAreaFile(file)) {
        notes.push(t.unsupported(file.name))
        continue
      }
      if (file.size > AREA_FILE_MAX_BYTES) {
        notes.push(t.tooLarge(file.name))
        continue
      }
      const id = `${file.name}-${file.size}-${file.lastModified}`
      if (!next.has(id) && next.size >= AREA_FILE_MAX_COUNT) {
        notes.push(t.tooMany)
        break
      }
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
        const dataUrl = await readFile(file, 'dataUrl')
        next.set(id, {
          id,
          fileName: file.name,
          contentType: file.type || CONTENT_TYPES[ext] || 'application/octet-stream',
          sizeBytes: file.size,
          dataUrl,
        })
        if (GEO_EXT.test(file.name)) {
          const area = parseAreaFile(file.name, await readFile(file, 'text'))
          if (area) parsed = { name: file.name, area }
          else notes.push(t.unreadable(file.name))
        }
      } catch {
        notes.push(t.unsupported(file.name))
      }
    }

    onChange(Array.from(next.values()))
    if (parsed) {
      onParsed(parsed.area)
      notes.push(t.applied(parsed.name))
    }
    setMessages(notes)
  }

  return (
    <div>
      <FormField id="co-area-files" label={t.label}>
        <div className="co-upload">
          <input
            id="co-area-files"
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
            htmlFor="co-area-files"
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
      <div className="co-help">{t.hint}</div>
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
              {file.contentType.startsWith('image/') ? (
                <img src={file.dataUrl} alt={file.fileName} />
              ) : null}
              <span className="co-attach-name" title={file.fileName}>
                {file.fileName}
              </span>
              <button
                type="button"
                className="co-attach-remove"
                aria-label={t.removeNamed(file.fileName)}
                title={t.removeNamed(file.fileName)}
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
