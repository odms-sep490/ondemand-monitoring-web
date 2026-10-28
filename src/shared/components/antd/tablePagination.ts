import type { TablePaginationConfig } from 'antd'
import { useEffect, useState } from 'react'

import { useI18n } from '../../i18n'
import { tablePaginationMessages } from './tablePagination.messages'

export const TABLE_PAGE_SIZE = 10
export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50]
export const GRID_PAGE_SIZE = 12

type RowKey<T> = string | ((row: T) => string | number) | undefined

function rowId<T extends object>(row: T, rowKey: RowKey<T>, index: number): string {
  if (typeof rowKey === 'function') return String(rowKey(row))
  if (typeof rowKey === 'string') return String((row as Record<string, unknown>)[rowKey])
  return String(index)
}

/**
 * Uniform client-side pagination config for every manager table.
 * Resets to page 1 whenever the visible row set changes (filter/search/tab).
 */
export function useTablePagination<T extends object>(
  rows: readonly T[] | undefined,
  rowKey?: RowKey<T>,
): TablePaginationConfig {
  const { t } = useI18n(tablePaginationMessages)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE)
  const signature = (rows ?? []).map((r, i) => rowId(r, rowKey, i)).join('|')

  useEffect(() => {
    setCurrent(1)
  }, [signature])

  return {
    current,
    pageSize,
    pageSizeOptions: TABLE_PAGE_SIZE_OPTIONS,
    showSizeChanger: true,
    hideOnSinglePage: (rows?.length ?? 0) <= TABLE_PAGE_SIZE,
    position: ['bottomRight'],
    showTotal: (total, range) => t.range(range[0], range[1], total),
    locale: { items_per_page: t.perPage, prev_page: t.prev, next_page: t.next },
    onChange: (page, size) => {
      setCurrent(page)
      setPageSize(size)
    },
  }
}
