import { useI18n } from '../../../../../shared/i18n'
import { pagerMessages } from './Pager.messages'

export function Pager({
  page,
  totalPages,
  totalItems,
  onPage,
  disabled = false,
}: {
  page: number
  totalPages: number
  totalItems: number
  onPage: (page: number) => void
  disabled?: boolean
}) {
  const { t } = useI18n(pagerMessages)
  return (
    <div className="adm-pager">
      <span className="adm-pager-page">
        {t.total}: {totalItems}
      </span>
      <div className="adm-pager-nav">
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-sm"
          disabled={disabled || page <= 0}
          onClick={() => onPage(page - 1)}
        >
          {t.prev}
        </button>
        <span className="adm-pager-page">
          {t.page} {page + 1} {t.of} {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-sm"
          disabled={disabled || page + 1 >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          {t.next}
        </button>
      </div>
    </div>
  )
}
