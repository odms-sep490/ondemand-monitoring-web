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
    previewUnavailable: 'Không xem trước được ảnh',
    empty: 'Không có media phù hợp.',
    error: 'Không tải được danh sách media. Hãy thử tải lại.',
    retry: 'Thử lại',
    loading: 'Đang tải media…',
    previous: 'Trang trước',
    more: 'Trang sau',
    attaching: 'Đang upload và gắn bằng chứng…',
    attachError:
      'Chưa upload hoặc gắn được media. Tệp đã chọn vẫn được giữ lại; hãy thử lại.',
    uploadHint:
      'Chọn ảnh/video rồi xác nhận. File mới sẽ tự upload; cửa sổ giữ mở đến khi gắn xong.',
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
    previewUnavailable: 'Image preview unavailable',
    empty: 'No matching files.',
    error: 'Could not load the media list. Please try again.',
    retry: 'Retry',
    loading: 'Loading media…',
    previous: 'Previous page',
    more: 'Next page',
    attaching: 'Uploading and attaching evidence…',
    attachError:
      'Could not upload or attach the media. Your selection is preserved; try again.',
    uploadHint:
      'Select images or videos and confirm. New files upload automatically; the dialog stays open until attached.',
  },
})
