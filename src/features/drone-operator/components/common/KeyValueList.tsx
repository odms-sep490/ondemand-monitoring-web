import { Descriptions } from 'antd'
import type { ReactNode } from 'react'

export type KeyValueItem = { key?: string; label: ReactNode; value: ReactNode }

/** Compact label/value list on antd Descriptions (single column, no border). */
export function KeyValueList({
  items,
  column = 1,
}: {
  items: KeyValueItem[]
  column?: number
}) {
  return (
    <Descriptions
      size="small"
      column={column}
      colon={false}
      styles={{ label: { color: 'var(--mgr-muted)' } }}
      items={items.map((item, i) => ({
        key: item.key ?? String(i),
        label: item.label,
        children: item.value,
      }))}
    />
  )
}
