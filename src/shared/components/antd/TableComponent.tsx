import { Table, type TableProps } from 'antd'

/** antd Table wrapper: compact, borderless-by-default, light sticky-style header from theme. */
export function TableComponent<T extends object>({
  className = '',
  ...props
}: TableProps<T>) {
  return (
    <Table<T>
      size="middle"
      pagination={false}
      className={`mgr-atable ${className}`.trim()}
      {...props}
    />
  )
}
