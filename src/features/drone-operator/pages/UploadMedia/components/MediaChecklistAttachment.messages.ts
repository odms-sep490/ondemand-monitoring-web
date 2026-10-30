import { defineMessages } from '../../../../../shared/i18n'

export const mediaChecklistAttachmentMessages = defineMessages({
  vi: {
    wrongType: 'Không phù hợp loại bằng chứng',
    autoPending:
      'Xác nhận để tự tải file lên và gắn vào các mục đã chọn. File đã tải sẽ không được tải lại.',
    queued: 'Đã thêm vào hàng đợi gắn bằng chứng.',
    remove: 'Gỡ khỏi mục này',
    removeConfirm:
      'Gỡ bằng chứng khỏi mục này? File chỉ được dọn trên S3 khi không còn được sử dụng và chưa thuộc hồ sơ nghiệm thu cần giữ.',
    removed: 'Đã gỡ liên kết. Hệ thống tự dọn file nếu không còn được sử dụng.',
    attach: 'Gắn vào checklist',
    edit: 'Chọn mục checklist',
    title: 'Gắn media vào checklist',
    description:
      'Một ảnh hoặc video có thể làm bằng chứng cho nhiều mục. Chọn những mục phù hợp với nội dung file.',
    search: 'Tìm theo tên hoặc nội dung checklist…',
    selected: (n: number) => `Đã chọn ${n} mục`,
    attached: (n: number) => `Đã gắn ${n} mục`,
    alreadyAttached: 'Đã gắn',
    choosing: 'Đang chọn',
    evidence: (count: number, minimum: number) =>
      `${count}/${minimum} bằng chứng hợp lệ`,
    images: (count: number, minimum: number) => `Ảnh ${count}/${minimum}`,
    videos: (count: number, minimum: number) => `Video ${count}/${minimum}`,
    cancel: 'Hủy',
    save: 'Lưu lựa chọn',
    confirm: (n: number) => `Gắn vào ${n} mục`,
    selectVisible: 'Chọn các mục đang hiển thị',
    clear: 'Bỏ lựa chọn',
    noResults: 'Không tìm thấy mục phù hợp.',
    empty: 'Mission chưa có mục checklist.',
    pending:
      'File chưa tải lên. Các mục bạn chọn sẽ được gắn khi tải file lên thành công.',
    existing:
      'Các mục đã gắn được giữ nguyên. Việc chọn thêm ở đây không gỡ hoặc xóa bằng chứng hiện có.',
    failed:
      'Chưa gắn được bằng chứng. Lựa chọn của bạn được giữ lại; hãy thử lại.',
    saved: 'Đã lưu lựa chọn checklist.',
    attachedSuccess: 'Đã gắn bằng chứng vào checklist.',
    more: (n: number) => `+${n} mục khác`,
  },
  en: {
    wrongType: 'Evidence type does not match',
    autoPending:
      'Confirm to upload this file and attach it to the selected items. Files already uploaded are reused.',
    queued: 'Evidence attachment queued.',
    remove: 'Remove from this item',
    removeConfirm:
      'Remove evidence from this item? S3 cleanup only applies when the file has no remaining references and is not retained in an accepted result.',
    removed:
      'Attachment removed. Unused draft files are cleaned up automatically.',
    attach: 'Attach to checklist',
    edit: 'Choose checklist items',
    title: 'Attach media to checklist',
    description:
      'One image or video can support several items. Choose the items that match this file.',
    search: 'Search checklist names or content…',
    selected: (n: number) => `${n} items selected`,
    attached: (n: number) => `Attached to ${n} items`,
    alreadyAttached: 'Attached',
    choosing: 'Selected',
    evidence: (count: number, minimum: number) =>
      `${count}/${minimum} valid evidence files`,
    images: (count: number, minimum: number) => `Images ${count}/${minimum}`,
    videos: (count: number, minimum: number) => `Videos ${count}/${minimum}`,
    cancel: 'Cancel',
    save: 'Save selection',
    confirm: (n: number) => `Attach to ${n} items`,
    selectVisible: 'Select visible items',
    clear: 'Clear selection',
    noResults: 'No matching items found.',
    empty: 'This mission has no checklist items.',
    pending:
      'This file has not been uploaded. Selected items will be linked after the upload succeeds.',
    existing:
      'Existing attachments are kept. Selecting additional items here does not remove or delete existing evidence.',
    failed:
      'Could not attach evidence. Your selection is preserved; please try again.',
    saved: 'Checklist selection saved.',
    attachedSuccess: 'Evidence attached to checklist.',
    more: (n: number) => `+${n} more items`,
  },
})
