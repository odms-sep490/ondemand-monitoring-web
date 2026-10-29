import { defineMessages } from '../../../../shared/i18n'
import type { StatusTagTone } from '../../../../shared/components/antd'
import type { AuditAction } from '../../types/auditLog'

export const AUDIT_ACTIONS: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'STATUS_CHANGE',
]

export const ACTION_TONE: Record<AuditAction, StatusTagTone> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  APPROVE: 'warning',
  STATUS_CHANGE: 'warning',
}

export const auditActionMessages = defineMessages({
  vi: {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    APPROVE: 'Phê duyệt',
    STATUS_CHANGE: 'Đổi trạng thái',
  },
  en: {
    CREATE: 'Create',
    UPDATE: 'Update',
    DELETE: 'Delete',
    APPROVE: 'Approve',
    STATUS_CHANGE: 'Status change',
  },
})
