import { Form } from 'antd'
import type { ReactNode } from 'react'

/** Labelled form row (antd Form.Item) with an inline error; drop-in for the legacy FormField. */
export function AdminField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <Form.Item
      label={
        <>
          {label} {required && <span className="adm-required">*</span>}
        </>
      }
      htmlFor={id}
      validateStatus={error ? 'error' : undefined}
      help={
        error ? (
          <span id={`${id}-error`} role="alert">
            {error}
          </span>
        ) : undefined
      }
      required={false}
    >
      {children}
    </Form.Item>
  )
}
