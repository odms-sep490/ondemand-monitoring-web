import {
  createElement,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react'

import { Icon, type IconName } from '../Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

type OwnProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner, sets aria-busy and blocks clicks. */
  loading?: boolean
  /** Optional leading icon. */
  icon?: IconName
  /** Renders an `<a>` instead of a `<button>`. */
  href?: string
  /** Custom element/component, e.g. a router Link (receives `to` etc. via props). */
  as?: ComponentType<Record<string, unknown>>
  children?: ReactNode
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  ref?: Ref<HTMLButtonElement>
}

type Props = OwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof OwnProps> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof OwnProps | 'type'> & {
    to?: string
  }

/** Shared button: primary / secondary / ghost / danger, sm / md, loading, icon and link modes. */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  href,
  as,
  children,
  className,
  disabled,
  onClick,
  type,
  ref,
  ...rest
}: Props) {
  const inactive = Boolean(disabled) || loading
  const classes = [
    'ui-btn',
    `is-${variant}`,
    size === 'sm' ? 'is-sm' : '',
    inactive ? 'is-disabled' : '',
    loading ? 'is-loading' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {loading ? (
        <span className="ui-spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="ui-btn-icon" aria-hidden="true">
          <Icon name={icon} width={16} height={16} />
        </span>
      ) : null}
      {children}
    </>
  )

  if (href !== undefined || as) {
    const handleClick = (e: MouseEvent<HTMLElement>) => {
      if (inactive) {
        e.preventDefault()
        return
      }
      onClick?.(e as unknown as MouseEvent<HTMLButtonElement>)
    }
    const linkProps = {
      ...rest,
      ref,
      className: classes,
      onClick: handleClick,
      'aria-disabled': inactive || undefined,
      'aria-busy': loading || undefined,
      ...(href !== undefined ? { href } : {}),
    }
    return as ? createElement(as, linkProps, content) : createElement('a', linkProps, content)
  }

  return (
    <button
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      ref={ref}
      type={type ?? 'button'}
      className={classes}
      disabled={inactive}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {content}
    </button>
  )
}
