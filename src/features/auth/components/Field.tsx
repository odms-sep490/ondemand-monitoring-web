import { Form } from 'antd'
import type { ReactNode } from 'react'

/** Labelled form row (antd Form.Item). The error is announced as an alert. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <Form.Item
      className="auth-field"
      label={label}
      htmlFor={htmlFor}
      labelCol={{ span: 24 }}
      wrapperCol={{ span: 24 }}
      validateStatus={error ? 'error' : undefined}
      extra={hint}
    >
      {children}
      {error ? (
        <p className="auth-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </Form.Item>
  )
}
