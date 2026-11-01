import { Input, Tag } from 'antd'

import {
  encodeLocalizedText,
  useI18n,
  type LocalizedText,
} from '../../../../shared/i18n'
import { missingLanguage } from '../../lib/localizedField'
import { localizedTextInputMessages } from './LocalizedTextInput.messages'

type Props = {
  /** Base id; the inputs are `${id}-vi` and `${id}-en`. */
  id: string
  label: string
  value?: LocalizedText
  onChange?: (value: LocalizedText) => void
  /** Both languages are required (shows "missing" on an empty one). */
  required?: boolean
  multiline?: boolean
  rows?: number
  placeholder?: string
  /** Limit on the encoded `{"vi":..,"en":..}` string; shows a counter. */
  maxEncoded?: number
  error?: string
  disabled?: boolean
}

const EMPTY: LocalizedText = { vi: '', en: '' }

/**
 * Bilingual (Vietnamese + English) text control. Works as a controlled input
 * and as an antd `Form.Item` control (`value` / `onChange` of `LocalizedText`).
 */
export function LocalizedTextInput({
  id,
  label,
  value = EMPTY,
  onChange,
  required,
  multiline,
  rows = 3,
  placeholder,
  maxEncoded,
  error,
  disabled,
}: Props) {
  const { t } = useI18n(localizedTextInputMessages)
  const used = encodeLocalizedText(value).length
  const over = maxEncoded !== undefined && used > maxEncoded
  const absent = missingLanguage(value)
  const langs = [
    ['vi', t.vi, 'VN'],
    ['en', t.en, 'EN'],
  ] as const

  return (
    <div className="adm-localized" role="group" aria-label={label}>
      {langs.map(([lang, name, badge]) => {
        const text = value[lang]
        const empty = !text.trim()
        const fieldProps = {
          id: `${id}-${lang}`,
          value: text,
          disabled,
          placeholder,
          status:
            error || over || (required && empty)
              ? ('error' as const)
              : undefined,
          'aria-label': `${label} (${name})`,
          'aria-invalid': Boolean(error) || over,
        }
        const update = (next: string) => onChange?.({ ...value, [lang]: next })
        return (
          <div key={lang} className="adm-localized-row">
            <div className="adm-localized-head">
              <Tag bordered={false} color={lang === 'vi' ? 'red' : 'blue'}>
                {badge}
              </Tag>
              <span>{name}</span>
              {required && empty && (
                <Tag bordered={false} color="warning">
                  {t.missing}
                </Tag>
              )}
            </div>
            {multiline ? (
              <Input.TextArea
                {...fieldProps}
                rows={rows}
                onChange={(e) => update(e.target.value)}
              />
            ) : (
              <Input {...fieldProps} onChange={(e) => update(e.target.value)} />
            )}
          </div>
        )
      })}
      {!required && absent && (
        <small className="adm-localized-hint" role="status">
          {t.suggest(absent === 'vi' ? t.vi : t.en)}
        </small>
      )}
      {maxEncoded !== undefined && (
        <small
          className={`adm-localized-counter${over ? ' is-over' : ''}`}
          role={over ? 'alert' : undefined}
        >
          {over ? t.tooLong(used, maxEncoded) : t.counter(used, maxEncoded)}
        </small>
      )}
    </div>
  )
}
