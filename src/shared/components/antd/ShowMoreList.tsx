import { Button } from 'antd'
import { Children, useState, type ReactNode } from 'react'

import { useI18n } from '../../i18n'
import { tablePaginationMessages } from './tablePagination.messages'

/** Renders the first `limit` children plus a "Xem thêm (n)" / "Thu gọn" toggle. */
export function ShowMoreList({ children, limit = 5 }: { children: ReactNode; limit?: number }) {
  const { t } = useI18n(tablePaginationMessages)
  const [open, setOpen] = useState(false)
  const items = Children.toArray(children)
  const hidden = items.length - limit
  return (
    <>
      {open || hidden <= 0 ? items : items.slice(0, limit)}
      {hidden > 0 ? (
        <Button
          type="link"
          size="small"
          className="mgr-show-more"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t.showLess : t.showMore(hidden)}
        </Button>
      ) : null}
    </>
  )
}
