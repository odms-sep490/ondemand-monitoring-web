import { describe, expect, it } from 'vitest'
import { matchLandingEntry, normalizeVi } from './landingKnowledge'

const idOf = (text: string, lang: 'vi' | 'en' = 'vi') => matchLandingEntry(text, lang)?.id

describe('landing assistant knowledge', () => {
  it('normalizes Vietnamese accents', () => {
    expect(normalizeVi('Chi phí thế nào?')).toBe('chi phi the nao')
    expect(normalizeVi('Đặt cọc')).toBe('dat coc')
  })

  it.each([
    ['Chi phí thế nào?', 'pricing'],
    ['chi phi bao nhieu tien', 'pricing'],
    ['Thanh toán qua VNPAY được không', 'payment'],
    ['Trời mưa thì sao?', 'weather'],
    ['Có giám sát định kỳ hằng tháng không', 'recurring'],
    ['Có những dịch vụ gì', 'services'],
    ['Kết quả chưa hài lòng thì làm lại được không', 'revision'],
    ['Có cần giấy phép bay không', 'permit'],
    ['Phục vụ ở Đồng Nai không', 'area'],
    ['Đăng ký tài khoản thế nào', 'account'],
    ['xin chào', 'greeting'],
    ['cảm ơn bạn', 'thanks'],
  ])('answers "%s" with %s', (text, id) => {
    expect(idOf(text)).toBe(id)
  })

  it('answers English questions', () => {
    expect(idOf('How much does it cost?', 'en')).toBe('pricing')
    expect(matchLandingEntry('weather', 'en')?.answer).toMatch(/Weather/)
  })

  it('replies politely to rude or too-short input instead of "no match"', () => {
    expect(idOf('cc')).toBe('rude')
    expect(idOf('?')).toBe('short')
  })

  it('returns null for unrelated questions so the default message is used', () => {
    expect(matchLandingEntry('giá vàng hôm nay', 'vi')?.id).toBe('pricing')
    expect(matchLandingEntry('bóng đá tối nay', 'vi')).toBeNull()
  })
})
