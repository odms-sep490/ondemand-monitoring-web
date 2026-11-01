import { defineMessages } from '../../../../shared/i18n'

export const localizedTextInputMessages = defineMessages({
  vi: {
    vi: 'Tiếng Việt',
    en: 'English',
    missing: 'Thiếu',
    suggest: (lang: string) =>
      `Nên nhập thêm bản ${lang} để khách hàng thấy đúng ngôn ngữ.`,
    tooLong: (used: number, max: number) =>
      `Nội dung song ngữ quá dài (${used}/${max} ký tự khi lưu). Hãy rút gọn.`,
    counter: (used: number, max: number) =>
      `${used}/${max} ký tự khi lưu (cả hai ngôn ngữ)`,
  },
  en: {
    vi: 'Tiếng Việt',
    en: 'English',
    missing: 'Missing',
    suggest: (lang: string) =>
      `Consider adding the ${lang} version too so users see the right language.`,
    tooLong: (used: number, max: number) =>
      `The bilingual text is too long (${used}/${max} characters when saved). Please shorten it.`,
    counter: (used: number, max: number) =>
      `${used}/${max} characters when saved (both languages)`,
  },
})
