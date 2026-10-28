import { Table, type TableProps } from 'antd'

import { useTablePagination } from './tablePagination'

/**
 * antd Table wrapper: compact, borderless-by-default, light sticky-style header from theme.
 * Paginates client-side by default (10/20/50 per page); pass `pagination={false}` to opt out.
 */
export function TableComponent<T extends object>({
  className = '',
  pagination,
  ...props
}: TableProps<T>) {
  const defaultPagination = useTablePagination<T>(
    props.dataSource,
    props.rowKey as string | ((row: T) => string | number) | undefined,
  )
  return (
    <Table<T>
      size="middle"
      pagination={pagination === undefined ? defaultPagination : pagination}
      className={`mgr-atable ${className}`.trim()}
      {...props}
    />
  )
}
