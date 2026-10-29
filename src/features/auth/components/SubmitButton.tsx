import { Button } from 'antd'
import type { ReactNode } from 'react'

/** Full-width primary submit button for the auth forms. */
export function SubmitButton({
  busy,
  disabled,
  children,
}: {
  busy: boolean
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Button
      type="primary"
      htmlType="submit"
      size="large"
      block
      className="auth-submit"
      disabled={busy || disabled}
      aria-busy={busy}
    >
      {children}
    </Button>
  )
}
