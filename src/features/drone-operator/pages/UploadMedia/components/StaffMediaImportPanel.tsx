import { createStaffUploadIntent } from '../../../../media/upload/staffUploadIntent'
import './StaffMediaImportPanel.css'
import { useEffect, useRef, useState } from 'react'
import {
  readCaptureTime,
  toVietnamInput,
  vietnamInputToInstant,
  type CaptureTimeMetadata,
  type StaffFileSelection,
} from '../../../../media/capture/captureTime'
import { useI18n } from '../../../../../shared/i18n'

const messages = {
  vi: {
    title: 'Tải lên thủ công',
    formats: 'JPG, PNG hoặc MP4 · Tệp gốc từ drone',
    selected: (n: number) => `${n} tệp đã chọn`,
    ready: 'Sẵn sàng',
    review: 'Cần kiểm tra',
    choose: 'Thêm ảnh/video từ thẻ nhớ drone',
    reading: 'Đang đọc thời gian chụp/quay…',
    time: 'Thời gian chụp/quay — giờ Việt Nam (UTC+7)',
    missing: 'Không đọc được thời gian chụp/quay. Vui lòng bổ sung và ghi lý do.',
    metadata: 'Tự đọc từ siêu dữ liệu',
    assumed: 'Siêu dữ liệu thiếu múi giờ; áp dụng UTC+7.',
    invalid:
      'Thời gian ngoài cửa sổ bay hoặc trong tương lai. Hãy kiểm tra tệp và Nhiệm vụ.',
    confirm: 'Nhân viên xác nhận thủ công thời gian này',
    reason: 'Lý do xác nhận hoặc điều chỉnh thời gian',
    upload: 'Tải lên các tệp đã xác nhận',
    clear: 'Bỏ danh sách',
    hint: 'Mỗi tệp có thời gian riêng. Tệp thiếu hoặc cần sửa thời gian phải có lý do xác nhận.',
    error: 'Không thể chuẩn bị danh sách tệp.',
  },
  en: {
    title: 'Manual upload',
    formats: 'JPG, PNG or MP4 · Original drone files',
    selected: (n: number) => `${n} files selected`,
    ready: 'Ready',
    review: 'Review required',
    choose: 'Add drone files from SD card',
    reading: 'Reading capture metadata…',
    time: 'Capture time — Vietnam (UTC+7)',
    missing:
      'Capture time unavailable. Enter the time and a confirmation reason.',
    metadata: 'Read from metadata',
    assumed: 'Metadata has no timezone; UTC+7 assumed.',
    invalid:
      'Time is outside the flight window or in the future. Check the file and Mission.',
    confirm: 'Confirm this capture time manually',
    reason: 'Reason for confirming or correcting capture time',
    upload: 'Upload confirmed files',
    clear: 'Clear selection',
    hint: 'Each file has its own capture time. Missing or corrected times require a confirmation reason.',
    error: 'Unable to prepare selected files.',
  },
}
type Row = {
  uploadIntentId: string
  file: File
  metadata: CaptureTimeMetadata | null
  localTime: string
  reason: string
  staffConfirmed: boolean
}
export function StaffMediaImportPanel({
  disabled,
  flightStart,
  flightEnd,
  onUpload,
  theme = 'light',
}: {
  theme?: 'light' | 'dark'
  disabled: boolean
  flightStart?: string | null
  flightEnd?: string | null
  onUpload: (files: StaffFileSelection[]) => Promise<void>
}) {
  const { t } = useI18n(messages)
  const [rows, setRows] = useState<Row[]>([])
  const [reading, setReading] = useState(false)
  const [error, setError] = useState(false)
  const generation = useRef(0)
  useEffect(
    () => () => {
      generation.current++
    },
    [],
  )
  const outsideWindow = (instant: string) =>
    Date.parse(instant) > Date.now() ||
    Boolean(
      flightStart && Date.parse(instant) < Date.parse(flightStart) - 1800000,
    ) ||
    Boolean(flightEnd && Date.parse(instant) > Date.parse(flightEnd) + 1800000)
  const selection = (row: Row): StaffFileSelection | null => {
    try {
      const capturedAt = vietnamInputToInstant(row.localTime)
      if (outsideWindow(capturedAt)) return null
      const unchanged =
        !row.staffConfirmed &&
        row.metadata &&
        Math.abs(Date.parse(row.metadata.instant) - Date.parse(capturedAt)) <
          1000
      if (!unchanged && !row.reason.trim()) return null
      return {
        file: row.file,
        uploadIntentId: row.uploadIntentId,
        capturedAt,
        declaration: {
          captureTimeSource: unchanged ? 'METADATA' : 'STAFF_CONFIRMED',
          captureTimeZone: unchanged ? row.metadata!.zone : 'Asia/Ho_Chi_Minh',
          captureTimeConfirmationReason: unchanged
            ? undefined
            : row.reason.trim(),
        },
      }
    } catch {
      return null
    }
  }
  const ready = rows.map(selection)
  const update = (index: number, change: Partial<Row>) =>
    setRows((previous) =>
      previous.map((row, i) => (i === index ? { ...row, ...change } : row)),
    )
  return (
    <section
      className={`staff-media-import staff-media-import--${theme}`}
      aria-label={t.title}
      aria-busy={disabled || reading}
    >
      <header className="staff-media-import__header">
        <span className="staff-media-import__icon" aria-hidden="true">
          ↑
        </span>
        <div>
          <h3>{t.title}</h3>
          <p>{t.formats}</p>
        </div>
      </header>
      <label
        className={`upload-media-staff-picker${disabled || reading ? ' is-disabled' : ''}`}
      >
        <span aria-hidden="true">＋</span>
        {t.choose}
        <input
          type="file"
          multiple
          aria-label={t.choose}
          accept="image/jpeg,image/png,video/mp4,.jpg,.jpeg,.png,.mp4"
          disabled={disabled || reading}
          onChange={async (event) => {
            const files = Array.from(event.currentTarget.files ?? [])
            event.currentTarget.value = ''
            const revision = ++generation.current
            setReading(true)
            setError(false)
            try {
              const next: Row[] = []
              for (const file of files) {
                const metadata = await readCaptureTime(file)
                next.push({
                  file,
                  uploadIntentId: createStaffUploadIntent(),
                  metadata,
                  localTime: metadata ? toVietnamInput(metadata.instant) : '',
                  reason: '',
                  staffConfirmed: false,
                })
              }
              if (revision === generation.current) setRows(next)
            } catch {
              if (revision === generation.current) setError(true)
            } finally {
              if (revision === generation.current) setReading(false)
            }
          }}
        />
      </label>
      <p className="staff-media-import__hint">{t.hint}</p>
      {reading && <p role="status">{t.reading}</p>}
      {error && <p role="alert">{t.error}</p>}
      {rows.length > 0 && (
        <p className="staff-media-import__selection">
          {t.selected(rows.length)}
        </p>
      )}
      <div className="staff-media-import__files">
        {rows.map((row, index) => (
          <details className="staff-media-import-row" key={index}>
            <summary>
              <span className="staff-media-import__filename">
                {row.file.name}
                <small>{(row.file.size / 1024 / 1024).toFixed(2)} MB</small>
              </span>
              <span
                className={`staff-media-import__badge${ready[index] ? ' is-ready' : ''}`}
              >
                {ready[index] ? t.ready : t.review}
              </span>
            </summary>
            <div className="staff-media-import__fields">
              <p>
                {row.metadata ? t.metadata : t.missing}
                {row.metadata?.zone === 'Asia/Ho_Chi_Minh'
                  ? ` · ${t.assumed}`
                  : ''}
              </p>
              <label>
                {t.time}
                <input
                  type="datetime-local"
                  step="1"
                  value={row.localTime}
                  disabled={disabled}
                  aria-label={`${t.time}: ${row.file.name}`}
                  onChange={(event) =>
                    update(index, { localTime: event.target.value })
                  }
                />
              </label>
              {row.localTime &&
                (() => {
                  try {
                    return outsideWindow(vietnamInputToInstant(row.localTime))
                  } catch {
                    return true
                  }
                })() && <p role="alert">{t.invalid}</p>}
              {row.metadata && (
                <label>
                  <input
                    type="checkbox"
                    checked={row.staffConfirmed}
                    disabled={disabled}
                    aria-label={`${t.confirm}: ${row.file.name}`}
                    onChange={(event) =>
                      update(index, { staffConfirmed: event.target.checked })
                    }
                  />
                  {t.confirm}
                </label>
              )}
              {(row.staffConfirmed ||
                !row.metadata ||
                row.localTime !== toVietnamInput(row.metadata.instant)) && (
                <label>
                  {t.reason}
                  <textarea
                    aria-label={`${t.reason}: ${row.file.name}`}
                    value={row.reason}
                    maxLength={500}
                    disabled={disabled}
                    onChange={(event) =>
                      update(index, { reason: event.target.value })
                    }
                  />
                </label>
              )}
            </div>
          </details>
        ))}
      </div>
      {rows.length > 0 && (
        <div className="staff-media-import__actions">
          <button
            type="button"
            className="staff-media-import__submit"
            disabled={disabled || reading || ready.some((row) => !row)}
            onClick={async () => {
              await onUpload(
                ready.filter((row): row is StaffFileSelection => row !== null),
              )
              // Keep file selection for explicit retry if any transfer failed. Never auto retry.
            }}
          >
            {t.upload}
          </button>
          <button
            type="button"
            className="staff-media-import__clear"
            disabled={disabled || reading}
            onClick={() => setRows([])}
          >
            {t.clear}
          </button>
        </div>
      )}
    </section>
  )
}
