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
    <div className="adm-row-actions">
      <button
        type="button"
        className="odm-btn odm-btn-gh odm-btn-sm"
        onClick={onEdit}
        aria-label={`${t.edit} ${label}`}
      >
        {t.edit}
      </button>
      {onDelete && (
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-sm catalog-delete-action"
          onClick={onDelete}
          aria-label={`${t.remove} ${label}`}
        >
          {t.remove}
        </button>
      )}
    </div>
  )
}
