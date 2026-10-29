import { Button, Space } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { rowActionsMessages } from './RowActions.messages'

export function RowActions({
  label,
  onEdit,
  onDelete,
}: {
  label: string
  onEdit: () => void
  onDelete?: () => void
}) {
  const { t } = useI18n(rowActionsMessages)
  return (
    <Space size={4} className="adm-row-actions">
      <Button size="small" onClick={onEdit} aria-label={`${t.edit} ${label}`}>
        {t.edit}
      </Button>
      {onDelete && (
        <Button size="small" danger onClick={onDelete} aria-label={`${t.remove} ${label}`}>
          {t.remove}
        </Button>
      )}
    </Space>
  )
}
