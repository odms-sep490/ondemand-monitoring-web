import { expect, it } from 'vitest'
import { editorialChanges, explainEditorialChange } from './editorialExplanation'

it('highlights separate edits without highlighting unchanged sentences', () => {
  const before = 'gồm ảnh. Giữ nguyên câu giữa. Xong.'
  const after = 'bao gồm ảnh. Giữ nguyên câu giữa. Hoàn tất.'
  const parts = editorialChanges(before, after)
  expect(parts.some(p => p.kind === 'same' && p.text.includes('Giữ nguyên câu giữa.'))).toBe(true)
  expect(parts.filter(p => p.kind !== 'removed').map(p => p.text).join('')).toBe(after)
  expect(parts.filter(p => p.kind !== 'added').map(p => p.text).join('')).toBe(before)
})
it('does not describe a longer proposal as concise', () => {
  const reasons = explainEditorialChange('gồm ảnh', 'bao gồm ảnh', 'shorten').join(' ')
  expect(reasons).toContain('tăng từ 2 lên 3')
  expect(reasons).toContain('chưa đáp ứng mục tiêu rút gọn')
})
it('explains actual removed wording and word reduction', () => {
  const reasons = explainEditorialChange('Chúng tôi đã kiểm tra khu A.', 'Đã kiểm tra khu A.', 'shorten').join(' ')
  expect(reasons).toContain('bớt 2 từ')
  expect(reasons).toContain('Chúng tôi đã')
})
it('handles empty and unchanged text', () => {
  expect(editorialChanges('', '')).toEqual([])
  expect(explainEditorialChange('giữ nguyên', 'giữ nguyên', 'professional')[0]).toContain('Giữ nguyên')
})
it('bounds comparison for large documents while preserving both texts', () => {
  const a = 'nguồn '.repeat(1100), b = 'đề xuất '.repeat(1100)
  const parts = editorialChanges(a, b)
  expect(parts.filter(p => p.kind !== 'added').map(p => p.text).join('')).toBe(a)
  expect(parts.filter(p => p.kind !== 'removed').map(p => p.text).join('')).toBe(b)
})
