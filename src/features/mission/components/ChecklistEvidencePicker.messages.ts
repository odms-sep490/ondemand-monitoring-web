import { defineMessages } from '../../../shared/i18n'
export const checklistEvidencePickerMessages = defineMessages({
  vi: {
    pick: 'Chọn media làm bằng chứng',
    cancel: 'Hủy',
    selected: (n: number) => `Gắn ${n} file`,
    search: 'Tìm theo tên file…',
    evidence: 'Loại media',
    all: 'Tất cả',
    image: 'Ảnh',
    video: 'Video',
    empty: 'Không có media phù hợp.',
    error: 'Không tải hoặc gắn được bằng chứng. Lựa chọn của bạn được giữ lại.',
    retry: 'Thử lại',
    loading: 'Đang tải media…',
    previous: 'Trang trước',
    more: 'Trang sau',
    uploadHint:
      'Chọn nhiều ảnh/video rồi xác nhận. File chưa tải sẽ tự upload; file đã có được dùng lại.',
  },
  en: {
    pick: 'Select evidence files',
    cancel: 'Cancel',
    selected: (n: number) => `Attach ${n} files`,
    search: 'Search file names…',
    evidence: 'Media type',
    all: 'All',
    image: 'Image',
    video: 'Video',
    empty: 'No matching files.',
    error: 'Could not load or attach evidence. Your selection is preserved.',
    retry: 'Retry',
    loading: 'Loading media…',
    previous: 'Previous page',
    more: 'Next page',
    uploadHint:
      'Select multiple images or videos and confirm. New files upload automatically; existing files are reused.',
  },
})
