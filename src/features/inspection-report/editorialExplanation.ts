export type TextChange = { text: string; kind: 'same' | 'added' | 'removed' }

/** Compare the actual proposal, including deletions; never invent a model rationale. */
export function editorialChanges(before: string, after: string): TextChange[] {
  const a = before.match(/\S+\s*/g) ?? []
  const b = after.match(/\S+\s*/g) ?? []
  const changes: TextChange[] = []
  const add = (text: string, kind: TextChange['kind']) => {
    const last = changes.at(-1)
    if (last?.kind === kind) last.text += text
    else changes.push({ text, kind })
  }
  if (a.length * b.length > 1_000_000) {
    let start = 0, end = 0
    while (start < a.length && start < b.length && a[start] === b[start]) start++
    while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++
    add(a.slice(0, start).join(''), 'same')
    add(a.slice(start, a.length - end).join(''), 'removed')
    add(b.slice(start, b.length - end).join(''), 'added')
    if (end) add(b.slice(-end).join(''), 'same')
    return changes.filter(c => c.text)
  }
  const rows = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      rows[i][j] = a[i] === b[j] ? rows[i + 1][j + 1] + 1 : Math.max(rows[i + 1][j], rows[i][j + 1])
  let i = 0, j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { add(b[j++], 'same'); i++ }
    else if (i < a.length && (j === b.length || rows[i + 1][j] >= rows[i][j + 1])) add(a[i++], 'removed')
    else add(b[j++], 'added')
  }
  return changes
}

export function explainEditorialChange(before: string, after: string, mode: string) {
  if (before === after) return ['Giữ nguyên đoạn này vì đề xuất chưa có thay đổi.']
  const count = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
  const delta = count(before) - count(after)
  const reasons = [delta > 0
    ? `Đoạn được giảm từ ${count(before)} xuống ${count(after)} từ (bớt ${delta} từ).`
    : delta < 0 ? `Đoạn tăng từ ${count(before)} lên ${count(after)} từ; đây là thay đổi cách diễn đạt, chưa phải rút gọn.`
      : `Đổi cách diễn đạt; số từ vẫn là ${count(after)}.`]
  const changes = editorialChanges(before, after).filter(c => c.kind !== 'same' && c.text.trim())
  const quote = (text: string) => `“${text.trim().slice(0, 160)}${text.trim().length > 160 ? '…' : ''}”`
  for (let n = 0; n < changes.length && reasons.length < 5; n++) {
    const item = changes[n], next = changes[n + 1]
    if (item.kind === 'removed' && next?.kind === 'added') {
      reasons.push(`Đổi ${quote(item.text)} thành ${quote(next.text)}.`); n++
    } else reasons.push(`${item.kind === 'removed' ? 'Bỏ' : 'Thêm'} ${quote(item.text)}.`)
  }
  if (mode === 'shorten') reasons.push(delta > 0 ? 'Mục tiêu: giảm câu chữ, giữ nội dung còn lại để bạn đối chiếu.' : 'Thay đổi này chưa đáp ứng mục tiêu rút gọn; bạn có thể bỏ đề xuất hoặc tạo lại.')
  if (mode === 'professional') reasons.push('Mục tiêu của chế độ này là điều chỉnh cách dùng từ theo văn phong báo cáo. Nếu chỉ thay một vài từ mà câu không rõ hơn, bạn có thể giữ bản gốc.')
  if (mode === 'simplify') reasons.push('Mục tiêu là dùng cách diễn đạt dễ hiểu hơn. Đối chiếu các cụm được thay bên trên để kiểm tra ý nghĩa có còn đúng với nội dung bạn muốn nói.')
  if (mode === 'summarize') reasons.push('Mục tiêu là cô đọng thông tin từ bản gốc. Các phần bị bỏ được tô sáng ở cột Hiện tại để bạn kiểm tra trước khi áp dụng.')
  if (mode === 'caption') reasons.push('Chỉ chỉnh chú thích bằng chứng; không suy ra kết quả giám sát mới từ ảnh/video.')
  return reasons
}
