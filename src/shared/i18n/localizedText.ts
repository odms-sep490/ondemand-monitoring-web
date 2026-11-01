import { useCallback } from 'react'

import { getLanguage, type Language } from './languageStore'
import { useLanguage } from './useI18n'

/**
 * Bilingual content stored inside a single backend text field as the JSON
 * string `{"vi":"...","en":"..."}`. Legacy plain text is still readable.
 */
export type LocalizedText = { vi: string; en: string }

export function encodeLocalizedText(value: LocalizedText): string {
  return JSON.stringify({ vi: value.vi.trim(), en: value.en.trim() })
}

function tryParse(raw: string): LocalizedText | null {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{')) return null
  try {
    const obj: unknown = JSON.parse(trimmed)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const { vi, en } = obj as Record<string, unknown>
      if (typeof vi === 'string' && typeof en === 'string') return { vi, en }
    }
  } catch {
    // malformed JSON: treated as plain text
  }
  return null
}

export function isLocalizedText(raw: string | null | undefined): boolean {
  return typeof raw === 'string' && tryParse(raw) !== null
}

export function parseLocalizedText(
  raw: string | null | undefined,
): LocalizedText {
  if (raw === null || raw === undefined) return { vi: '', en: '' }
  const text = String(raw)
  return tryParse(text) ?? { vi: text, en: text }
}

export function pickLocalizedText(
  raw: string | null | undefined,
  lang: Language,
): string {
  const parsed = parseLocalizedText(raw)
  const other: Language = lang === 'vi' ? 'en' : 'vi'
  return parsed[lang].trim() ? parsed[lang] : parsed[other]
}

/** Returns a decoder bound to the current UI language. */
export function useLocalizedText(): (raw: string | null | undefined) => string {
  const { lang } = useLanguage()
  return useCallback((raw) => pickLocalizedText(raw, lang), [lang])
}

/** Search haystack covering both languages (lower-cased). */
export function localizedSearchText(raw: string | null | undefined): string {
  const { vi, en } = parseLocalizedText(raw)
  return vi === en ? vi.toLowerCase() : `${vi} ${en}`.toLowerCase()
}

const EMBEDDED = /\{"vi":"(?:[^"\\]|\\.)*","en":"(?:[^"\\]|\\.)*"\}/g

// A backend that shortens long names ("...") can cut the JSON mid-way.
const TRUNCATED =
  /\{"vi":"((?:[^"\\]|\\.)*)(?:","en":"((?:[^"\\]|\\.)*))?\.\.\./g

/**
 * Decodes every `{"vi":..,"en":..}` object embedded in a longer string (for
 * backend-composed text such as "Checklist · rule description").
 */
export function decodeLocalizedInText(
  text: string | null | undefined,
  lang: Language = getLanguage(),
): string {
  if (!text) return text ?? ''
  return text
    .replace(EMBEDDED, (match) => pickLocalizedText(match, lang))
    .replace(
      TRUNCATED,
      (_m, vi: string, en?: string) => `${lang === 'en' && en ? en : vi}...`,
    )
}

/** Decodes for the current language outside React (re-evaluated on every render of a language-aware caller). */
export function displayLocalized(raw: string | null | undefined): string {
  return pickLocalizedText(raw, getLanguage())
}

/** Decodes every item of a list of (possibly bilingual) strings for the current language. */
export function displayLocalizedList(
  list: readonly string[] | null | undefined,
): string[] | null | undefined {
  return list ? list.map((item) => displayLocalized(item)) : list
}
