import type { ReactNode } from 'react'

export function FormField({
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
    <div className="ui-form-field">
      <label htmlFor={id} className="ui-label">
        {label} {required && <span className="ui-required">*</span>}
      </label>
      {children}
      {error && (
        <div id={`${id}-error`} className="ui-field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
