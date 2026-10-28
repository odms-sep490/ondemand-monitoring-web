import './mgrLayout.css'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  count?: number
}

type Props<T extends string> = {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/** Compact segmented control used for tabs and status filters on Manager pages. */
export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  return (
    <div className="mgr-seg" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'is-active' : ''}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined ? <span className="mgr-seg-count">{option.count}</span> : null}
        </button>
      ))}
    </div>
  )
}
