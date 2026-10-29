import { defineMessages } from '../../../../shared/i18n'

export const auditLogPageMessages = defineMessages({
  vi: {
    title: 'Nhật ký hệ thống',
    subtitle: 'Nhật ký thay đổi — chỉ đọc',
    exportCsv: 'Xuất CSV',
    exportSuccess:
      'Đã xuất CSV thành công. (Tạm thời — sẽ kết nối chức năng xuất tệp)',
    emptyTitle: 'Không có bản ghi nào',
    emptyDescription: 'Thử đổi hoặc xoá bộ lọc.',
  },
  en: {
    title: 'Audit log',
    subtitle: 'Change log — read-only',
    exportCsv: 'Export CSV',
    exportSuccess:
      'CSV exported successfully. (Placeholder — the export will be connected later)',
    emptyTitle: 'No records found',
    emptyDescription: 'Try changing or clearing the filters.',
  },
})
