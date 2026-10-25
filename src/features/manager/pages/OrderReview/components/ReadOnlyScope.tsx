import type { ReactNode } from 'react'

/** Completed stages stay readable but cannot be edited: a disabled fieldset covers every control inside. */
export function ReadOnlyScope({
  on,
  children,
}: {
  on: boolean
  children: ReactNode
}) {
  return on ? (
    <fieldset className="odm-or-readonly" disabled>
      {children}
    </fieldset>
  ) : (
    <>{children}</>
  )
}
