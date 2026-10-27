import { Pagination } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { useI18n } from '../../i18n'
import { GRID_PAGE_SIZE } from './tablePagination'
import { tablePaginationMessages } from './tablePagination.messages'

/** Slices a card-grid list into pages of 12 and renders a themed antd Pagination. */
export function usePagedGrid<T>(items: readonly T[], resetKey: string, pageSize = GRID_PAGE_SIZE) {
  const { t } = useI18n(tablePaginationMessages)
  const [page, setPage] = useState(1)
  useEffect(() => {
    setPage(1)
  }, [resetKey])
  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  )
  const pager =
    items.length > pageSize ? (
      <Pagination
        className="mgr-grid-pager"
        aria-label={t.ariaLabel}
        current={page}
        pageSize={pageSize}
        total={items.length}
        showSizeChanger={false}
        onChange={setPage}
        showTotal={(total, range) => t.range(range[0], range[1], total)}
        locale={{ prev_page: t.prev, next_page: t.next }}
      />
    ) : null
  return { pageItems, pager }
}
