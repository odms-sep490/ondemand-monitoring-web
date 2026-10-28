type Props = {
  variant?: 'line' | 'block' | 'circle'
  width?: number | string
  height?: number | string
  className?: string
}

/** Shimmering placeholder for loading states. */
export function Skeleton({ variant = 'line', width, height, className }: Props) {
  return (
    <span
      className={`ui-skeleton is-${variant}${className ? ` ${className}` : ''}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
