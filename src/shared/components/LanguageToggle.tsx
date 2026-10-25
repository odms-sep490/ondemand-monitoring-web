import { useLanguage } from '../i18n'

/**
 * Segmented VI | EN language switcher. No Provider required — reads and
 * writes the shared language store directly via `useLanguage()`.
 *
 * Meant to sit next to the existing theme toggle in every layout header;
 * pass `className` to adjust spacing/placement per layout.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage()
  const groupLabel = lang === 'en' ? 'Language' : 'Ngôn ngữ'

  return (
    <div
      className={`odm-lang-toggle${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={groupLabel}
    >
      <button
        type="button"
        aria-pressed={lang === 'vi'}
        aria-label="Tiếng Việt"
        onClick={() => setLang('vi')}
      >
        VI
      </button>
      <button
        type="button"
        aria-pressed={lang === 'en'}
        aria-label="English"
        onClick={() => setLang('en')}
      >
        EN
      </button>
    </div>
  )
}
