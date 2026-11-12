// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { parseExifCaptureTime, vietnamInputToInstant, toVietnamInput, readMp4CaptureTime, readImageCaptureTime } from './captureTime'

const blob = (bytes: Uint8Array) => ({ size: bytes.length, slice: (start: number, end: number) => ({ arrayBuffer: async () => bytes.slice(start, end).buffer }) }) as unknown as Blob

describe('Vietnam capture time contract' , () => {
  it('converts Vietnamese wall time to UTC across the previous day', () => {
    expect(vietnamInputToInstant('2026-11-11T01:15')).toBe('2026-11-10T18:15:00.000Z')
    expect(toVietnamInput('2026-11-10T18:15:00Z')).toBe('2026-11-11T01:15:00')
  })
  it('does not normalize impossible calendar dates', () => {
    expect(() => vietnamInputToInstant('2026-02-30T12:00')).toThrow()
    expect(() => vietnamInputToInstant('')).toThrow()
  })
  it('respects explicit offsets and assumes Vietnam only when no offset exists', () => {
    expect(parseExifCaptureTime('2026:11:10 08:15:30', '+02:00')).toEqual({ instant: '2026-11-10T06:15:30.000Z', zone: '+02:00' })
    expect(parseExifCaptureTime('2026:11:10 08:15:30')).toEqual({ instant: '2026-11-10T01:15:30.000Z', zone: 'Asia/Ho_Chi_Minh' })
    expect(parseExifCaptureTime('2026:11:10 01:15:30', '+00:00').instant).toBe('2026-11-10T01:15:30.000Z')
  })
  it.each([0, 1])('reads MP4 mvhd v%s as UTC, skipping media data', async version => {
    const bytes = new Uint8Array(8 + 24 + 8 + 108)
    const view = new DataView(bytes.buffer)
    const box = (at: number, size: number, type: string) => { view.setUint32(at, size); bytes.set(new TextEncoder().encode(type), at + 4) }
    box(0, 8, 'mdat'); box(8, 24, 'ftyp'); box(32, 116, 'moov'); box(40, 108, 'mvhd')
    bytes[48] = version
    const seconds = Date.parse('2026-11-10T01:15:30Z') / 1000 + 2082844800
    if (version) view.setBigUint64(52, BigInt(seconds)); else view.setUint32(52, seconds)
    expect(await readMp4CaptureTime(blob(bytes))).toEqual({ instant: '2026-11-10T01:15:30.000Z', zone: 'UTC' })
  })
  it('returns no capture time for malformed MP4 box boundaries', async () => {
    const bytes = new Uint8Array(16); new DataView(bytes.buffer).setUint32(0, 10000)
    expect(await readMp4CaptureTime(blob(bytes))).toBeNull()
  })
})

describe('real image metadata', () => {
  it('extracts JPEG capture time and offset without Date revival', async () => {
    const bytes = Uint8Array.from(atob('/9j/4QBbRXhpZgAASUkqAAgAAAABAGmHBAABAAAAGgAAAAAAAAACAAOQAgAUAAAAOAAAABGQAgAHAAAATAAAAAAAAAAyMDI2OjExOjEwIDA4OjE1OjMwACswNzowMAD/2Q=='), c => c.charCodeAt(0))
    expect(await readImageCaptureTime(bytes)).toEqual({ instant: '2026-11-10T01:15:30.000Z', zone: '+07:00' })
  })
  it('extracts PNG capture time and offset without Date revival', async () => {
    const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAU2VYSWZJSSoACAAAAAEAaYcEAAEAAAAaAAAAAAAAAAIAA5ACABQAAAA4AAAAEZACAAcAAABMAAAAAAAAADIwMjY6MTE6MTAgMDg6MTU6MzAAKzA3OjAwAAlOxJUAAAAASUVORK5CYII='), c => c.charCodeAt(0))
    expect(await readImageCaptureTime(bytes)).toEqual({ instant: '2026-11-10T01:15:30.000Z', zone: '+07:00' })
  })
})
