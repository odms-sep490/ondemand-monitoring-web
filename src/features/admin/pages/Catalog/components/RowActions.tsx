import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
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
      <Button
        size="small"
        icon={<EditOutlined aria-hidden="true" aria-label={undefined} />}
        onClick={onEdit}
        aria-label={`${t.edit} ${label}`}
      >
        {t.edit}
      </Button>
      {onDelete && (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined aria-hidden="true" aria-label={undefined} />}
          onClick={onDelete}
          aria-label={`${t.remove} ${label}`}
        >
          {t.remove}
        </Button>
      )}
    </Space>
  )
}
