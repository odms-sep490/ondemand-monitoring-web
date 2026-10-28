import { afterEach, describe, expect, it } from 'vitest'
import { setLanguage } from '../../../shared/i18n'
import {
  localizeMediaLabel,
  localizeTimeslot,
  preferredLabel,
  preferredRangeLabel,
} from './viLabels'

const WIN = '25/09/2026 · Chiều 13:00–17:00'

describe('viLabels date/window formatting', () => {
  afterEach(() => setLanguage('vi'))

  it('does not repeat the date when the window already contains it (vi)', () => {
    setLanguage('vi')
    expect(preferredRangeLabel('2026-09-25', '2026-09-25', null, WIN)).toBe(
      '25/09/2026 · Buổi chiều 13:00–17:00',
    )
    expect(preferredLabel('2026-09-25', null, WIN)).toBe(
      '25/09/2026 · Buổi chiều 13:00–17:00',
    )
  })

  it('upgrades a short date to the full one from the window', () => {
    setLanguage('vi')
    expect(preferredRangeLabel('25/09', '25/09', null, WIN)).toBe(
      '25/09/2026 · Buổi chiều 13:00–17:00',
    )
  })

  it('prepends the date when the window has none', () => {
    setLanguage('vi')
    expect(
      preferredRangeLabel('2026-09-25', '2026-09-25', null, 'Chiều 13:00–17:00'),
    ).toBe('25/09/2026 · Buổi chiều 13:00–17:00')
    expect(preferredLabel('2026-09-25', 'Morning')).toBe('25/09/2026 · Buổi sáng')
  })

  it('keeps ranges', () => {
    setLanguage('vi')
    expect(
      preferredRangeLabel('2026-09-25', '2026-09-27', 'Morning', null),
    ).toBe('25/09/2026 → 27/09/2026 · Buổi sáng')
  })

  it('localizes in English with mm/dd/yyyy', () => {
    setLanguage('en')
    expect(preferredRangeLabel('2026-09-25', '2026-09-25', null, WIN)).toBe(
      '09/25/2026 · Afternoon 13:00–17:00',
    )
    expect(preferredRangeLabel('25/09', '25/09', null, WIN)).toBe(
      '09/25/2026 · Afternoon 13:00–17:00',
    )
    expect(localizeTimeslot('Buổi sáng 07:00–11:00')).toBe('Morning 07:00–11:00')
  })

  it('localizes media requirement labels', () => {
    setLanguage('vi')
    expect(localizeMediaLabel('VIDEO × 2 · 300 giây · 1080p')).toBe(
      'Video × 2 · 300 giây · 1080p',
    )
    expect(localizeMediaLabel('PHOTO × 60')).toBe('Ảnh × 60')
    expect(localizeMediaLabel('LIVESTREAM')).toBe('Phát trực tiếp')
    setLanguage('en')
    expect(localizeMediaLabel('VIDEO × 2 · 300 giây · 1080p')).toBe(
      'Video × 2 · 300 sec · 1080p',
    )
    expect(localizeMediaLabel('PHOTO × 60')).toBe('Image × 60')
    expect(localizeMediaLabel('LIVESTREAM')).toBe('Live stream')
  })
})
