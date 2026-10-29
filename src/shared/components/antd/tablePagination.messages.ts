import { defineMessages } from '../../i18n'

export const tablePaginationMessages = defineMessages({
  vi: {
    range: (from: number, to: number, total: number) =>
      `${from}–${to} / ${total}`,
    perPage: '/ trang',
    prev: 'Trang trước',
    next: 'Trang sau',
    ariaLabel: 'Phân trang',
    showMore: (n: number) => `Xem thêm (${n})`,
    showLess: 'Thu gọn',
  },
  en: {
    range: (from: number, to: number, total: number) =>
      `${from}–${to} / ${total}`,
    perPage: '/ page',
    prev: 'Previous page',
    next: 'Next page',
    ariaLabel: 'Pagination',
    showMore: (n: number) => `Show more (${n})`,
    showLess: 'Show less',
  },
})
