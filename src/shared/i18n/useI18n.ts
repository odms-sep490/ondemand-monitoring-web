import { useCallback, useSyncExternalStore } from 'react'

import {
  getLanguage,
  setLanguage,
  subscribeLanguage,
  type Language,
} from './languageStore'

/** BCP 47 locale for a UI language, ready for `toLocaleString` / `Intl.*`. */
export function localeOf(lang: Language): 'vi-VN' | 'en-US' {
  return lang === 'en' ? 'en-US' : 'vi-VN'
}

/**
 * Subscribes the calling component to the current language (no Provider
 * needed) and returns `{ lang, setLang, locale }`.
 *
 * `locale` is `'vi-VN'` or `'en-US'`, ready to pass to `toLocaleString` /
 * `Intl.*` formatters.
 */
export function useLanguage(): {
  lang: Language
  setLang: (lang: Language) => void
  locale: 'vi-VN' | 'en-US'
} {
  const lang = useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage)
  const setLang = useCallback((next: Language) => setLanguage(next), [])
  return { lang, setLang, locale: localeOf(lang) }
}

/**
 * `useI18n(messages)` — subscribes to the current language and returns the
 * translated message tree for it, alongside `lang` / `setLang` / `locale`.
 *
 * Example:
 *   const messages = defineMessages({
 *     vi: { title: 'Đăng nhập' },
 *     en: { title: 'Login' },
 *   })
 *   const { t, lang, setLang, locale } = useI18n(messages)
 *   <h1>{t.title}</h1>
 */
export function useI18n<T>(messages: { vi: T; en: T }): {
  lang: Language
  setLang: (lang: Language) => void
  t: T
  locale: 'vi-VN' | 'en-US'
} {
  const { lang, setLang, locale } = useLanguage()
  return { lang, setLang, t: messages[lang], locale }
}
