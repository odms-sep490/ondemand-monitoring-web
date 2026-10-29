import { Button } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import './Pager.css'
import { pagerMessages } from './Pager.messages'

type Props = {
  /** Zero-based current page. */
  page: number
  totalPages: number
  totalItems: number
  /** Noun for the total, e.g. "tệp" / "files". */
  unit: string
  onPage: (page: number) => void
}

/** Prev / next pager shared by the customer lists (zero-based pages). */
export function Pager({ page, totalPages, totalItems, unit, onPage }: Props) {
  const { t } = useI18n(pagerMessages)
  return (
    <div className="cm-pager mgr-table-foot">
      <span>{t.total(totalItems, unit)}</span>
      <div className="cm-pager-nav">
        <Button size="small" disabled={page <= 0} onClick={() => onPage(page - 1)}>
          {t.prev}
        </Button>
        <span>{t.page(totalPages === 0 ? 0 : page + 1, totalPages)}</span>
        <Button size="small" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}>
          {t.next}
        </Button>
      </div>
    </div>
  )
}
