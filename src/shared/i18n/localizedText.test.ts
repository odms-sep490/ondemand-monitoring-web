import { describe, expect, it } from 'vitest'

import {
  decodeLocalizedInText,
  encodeLocalizedText,
  isLocalizedText,
  localizedSearchText,
  parseLocalizedText,
  pickLocalizedText,
} from './localizedText'

describe('localizedText codec', () => {
  it('encodes compact trimmed JSON', () => {
    expect(encodeLocalizedText({ vi: ' Giám sát ', en: ' Monitoring ' })).toBe(
      '{"vi":"Giám sát","en":"Monitoring"}',
    )
    expect(encodeLocalizedText({ vi: 'A', en: '' })).toBe('{"vi":"A","en":""}')
  })

  it('round-trips', () => {
    const v = { vi: 'Xin "chào"', en: 'Hello\nworld' }
    expect(parseLocalizedText(encodeLocalizedText(v))).toEqual(v)
  })

  it('treats legacy plain text as both languages', () => {
    expect(parseLocalizedText('Giám sát')).toEqual({
      vi: 'Giám sát',
      en: 'Giám sát',
    })
    expect(isLocalizedText('Giám sát')).toBe(false)
  })

  it('treats malformed JSON as plain text', () => {
    expect(parseLocalizedText('{"vi":')).toEqual({ vi: '{"vi":', en: '{"vi":' })
    expect(isLocalizedText('{"vi":')).toBe(false)
    expect(parseLocalizedText('{"vi":1,"en":2}').vi).toBe('{"vi":1,"en":2}')
  })

  it('ignores extra keys', () => {
    expect(parseLocalizedText('{"vi":"a","en":"b","x":1}')).toEqual({
      vi: 'a',
      en: 'b',
    })
    expect(isLocalizedText('{"vi":"a","en":"b"}')).toBe(true)
  })

  it('handles null/undefined', () => {
    expect(parseLocalizedText(null)).toEqual({ vi: '', en: '' })
    expect(pickLocalizedText(undefined, 'vi')).toBe('')
  })

  it('picks language with fallback', () => {
    const raw = '{"vi":"Xin chào","en":""}'
    expect(pickLocalizedText(raw, 'en')).toBe('Xin chào')
    expect(pickLocalizedText('{"vi":"a","en":"b"}', 'en')).toBe('b')
    expect(pickLocalizedText('plain', 'en')).toBe('plain')
  })

  it('builds a bilingual search haystack', () => {
    expect(localizedSearchText('{"vi":"Giám sát","en":"Monitor"}')).toBe(
      'giám sát monitor',
    )
    expect(localizedSearchText('Plain')).toBe('plain')
  })

  it('decodes embedded objects inside composed text', () => {
    const raw = 'Roof · {"vi":"Mái","en":"Roof"} / x'
    expect(decodeLocalizedInText(raw, 'vi')).toBe('Roof · Mái / x')
    expect(decodeLocalizedInText(raw, 'en')).toBe('Roof · Roof / x')
    expect(decodeLocalizedInText('plain', 'en')).toBe('plain')
    expect(decodeLocalizedInText('{"vi":"Mái nhà","en":"Ro... · x', 'vi')).toBe(
      'Mái nhà... · x'.replace('Mái nhà...', 'Mái nhà...'),
    )
  })
})
