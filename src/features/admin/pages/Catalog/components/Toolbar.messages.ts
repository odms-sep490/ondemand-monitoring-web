import { defineMessages } from '../../../../../shared/i18n'

export const catalogToolbarMessages = defineMessages({
  vi: {
    search: 'Tìm kiếm',
    placeholder: 'Nhập tên hoặc mã…',
    status: 'Trạng thái',
    all: 'Tất cả trạng thái',
    active: 'Hoạt động',
    inactive: 'Ngừng hoạt động',
    clear: 'Xóa bộ lọc',
    refresh: 'Làm mới',
    loading: 'Đang cập nhật danh sách…',
    noMatches: 'Không có kết quả phù hợp',
    noMatchesHint: 'Thử từ khóa khác hoặc xóa bộ lọc để xem lại danh sách.',
    results: (visible: number, total: number) =>
      `Hiển thị ${visible}/${total} mục`,
  },
  en: {
    search: 'Search',
    placeholder: 'Enter a name or code…',
    status: 'Status',
    all: 'All statuses',
    active: 'Active',
    inactive: 'Inactive',
    clear: 'Clear filters',
    refresh: 'Refresh',
    loading: 'Updating list…',
    noMatches: 'No matching results',
    noMatchesHint:
      'Try another search or clear the filters to see the full list.',
    results: (visible: number, total: number) =>
      `Showing ${visible} of ${total} items`,
  },
})
