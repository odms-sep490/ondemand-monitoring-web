import { SearchOutlined } from '@ant-design/icons'
import { Button, Input, Space } from 'antd'
import type { ReactNode } from 'react'

export type FilterOption<T extends string> = { value: T; label: string; count?: number }

type SegmentProps<T extends string> = {
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/** Button group that behaves like tabs/filters (buttons with aria-pressed). */
export function FilterSegments<T extends string>({ options, value, onChange, ariaLabel }: SegmentProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="mgr-filter-bar-seg">
      <Space.Compact>
        {options.map((option) => (
          <Button
            key={option.value}
            type={value === option.value ? 'primary' : 'default'}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined ? <span className="mgr-seg-count"> {option.count}</span> : null}
          </Button>
        ))}
      </Space.Compact>
    </div>
  )
}

type Props = {
  /** Controls placed before the search box (tabs/segments). */
  start?: ReactNode
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder: string
    ariaLabel: string
  }
  /** Controls placed at the end (selects, secondary segments). */
  end?: ReactNode
}

/** Card-style toolbar: segments + search + extra filters. */
export function FilterBar({ start, search, end }: Props) {
  return (
    <div className="mgr-filter-bar">
      {start}
      {search ? (
        <Input
          allowClear
          className="mgr-filter-bar-search"
          prefix={<SearchOutlined aria-hidden="true" />}
          value={search.value}
          onChange={(event) => search.onChange(event.target.value)}
          placeholder={search.placeholder}
          aria-label={search.ariaLabel}
        />
      ) : null}
      {end ? <div className="mgr-filter-bar-end">{end}</div> : null}
    </div>
  )
}
