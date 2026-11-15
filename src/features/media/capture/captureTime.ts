export type CaptureTimeMetadata = { instant: string; zone: string }
export type CaptureTimeDeclaration = {
  captureTimeSource: 'METADATA' | 'STAFF_CONFIRMED'
  captureTimeZone: string
  captureTimeConfirmationReason?: string
}
export type StaffFileSelection = { file: File; capturedAt: string; declaration: CaptureTimeDeclaration; uploadIntentId?: string }

/** Explicit offsets avoid interpreting a Vietnamese wall clock in the computer's timezone. */
export function vietnamInputToInstant(value: string): string {
  const local = value.length === 16 ? `${value}:00` : value
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?$/.exec(local)
  if (!match) throw new Error('Invalid Vietnam capture time')
  const normalized = `${match[1]}.${(match[2] || '').padEnd(3, '0')}`
  const date = new Date(`${normalized}+07:00`)
  if (!Number.isFinite(date.getTime()) || new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 23) !== normalized)
    throw new Error('Invalid Vietnam capture time')
  return date.toISOString()
}

export function toVietnamInput(instant: string): string {
  return new Date(Date.parse(instant) + 7 * 3600000).toISOString().slice(0, 19)
}

export function parseExifCaptureTime(value: string, offset?: string): CaptureTimeMetadata {
  const local = value.trim().replace(/^(\d{4}):(\d{2}):(\d{2}) /, '$1-$2-$3T')
  // Validate the local calendar first; Date.parse alone normalizes invalid dates.
  vietnamInputToInstant(local)
  if (offset && !/^[+-](?:(?:0\d|1[0-7]):[0-5]\d|18:00)$/.test(offset)) throw new Error('Invalid capture timezone')
  const instant = offset ? new Date(`${local}${offset}`).toISOString() : vietnamInputToInstant(local)
  return { instant, zone: offset || 'Asia/Ho_Chi_Minh' }
}

/** MP4 mvhd uses seconds since 1904-01-01 UTC. Skip mdat without loading video bytes. */
export async function readMp4CaptureTime(file: Blob): Promise<CaptureTimeMetadata | null> {
  let boxes = 0
  const scan = async (start: number, end: number, depth: number): Promise<CaptureTimeMetadata | null> => {
    for (let at = start; at + 8 <= end && boxes++ < 4096;) {
      const header = new DataView(await file.slice(at, at + 16).arrayBuffer())
      let size = header.getUint32(0), headSize = 8
      const type = String.fromCharCode(...new Uint8Array(header.buffer, 4, 4))
      if (size === 1) {
        if (header.byteLength < 16) return null
        size = Number(header.getBigUint64(8)); headSize = 16
      }
      if (size === 0) size = end - at
      if (!Number.isSafeInteger(size) || size < headSize || at + size > end) return null
      if (type === 'moov' && depth === 0) {
        const found = await scan(at + headSize, at + size, depth + 1)
        if (found) return found
      }
      if (type === 'mvhd' && depth === 1 && size >= headSize + 12) {
        const data = new DataView(await file.slice(at + headSize, at + headSize + 12).arrayBuffer())
        const version = data.getUint8(0)
        if (version !== 0 && version !== 1) return null
        const seconds = version === 1 ? Number(data.getBigUint64(4)) : data.getUint32(4)
        const ms = (seconds - 2082844800) * 1000
        return seconds > 0 && Number.isFinite(ms) && Math.abs(ms) < 8640000000000000
          ? { instant: new Date(ms).toISOString(), zone: 'UTC' } : null
      }
      at += size
    }
    return null
  }
  return scan(0, file.size, 0)
}

export async function readCaptureTime(file: File): Promise<CaptureTimeMetadata | null> {
  try {
    if (file.type === 'video/mp4' || /\.mp4$/i.test(file.name)) return await readMp4CaptureTime(file)
    return await readImageCaptureTime(file)
  } catch { return null }
}

export async function readImageCaptureTime(file: File | Uint8Array): Promise<CaptureTimeMetadata | null> {
  try {
    const { parse } = await import('exifr')
    const metadata = await parse(file, { reviveValues: false, pick: ['DateTimeOriginal', 'OffsetTimeOriginal'],
      chunkSize: 65536, chunkLimit: 16 })
    if (typeof metadata?.DateTimeOriginal !== 'string') return null
    return parseExifCaptureTime(metadata.DateTimeOriginal, metadata.OffsetTimeOriginal)
  } catch { return null }
}

export function captureTimeValidationMessage(message: string, language: string): string {
  if (language !== 'vi') return message
  if (message.startsWith('Capture metadata missing')) return 'Không đọc được thời gian chụp trong file. Hãy xác nhận thời gian và ghi lý do.'
  if (message.startsWith('Capture metadata time is invalid')) return 'Thời gian chụp trong file không hợp lệ. Hãy kiểm tra file gốc từ drone.'
  if (message.startsWith('Capture metadata time is outside')) return 'Thời gian chụp trong file nằm ngoài cửa sổ bay của Mission. Hãy kiểm tra file và Mission.'
  if (message.startsWith('Capture metadata differs')) return 'Thời gian trong file khác thời gian đã khai báo. Hãy kiểm tra và xác nhận điều chỉnh kèm lý do.'
  return message
}
