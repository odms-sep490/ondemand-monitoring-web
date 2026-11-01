import { Input } from 'antd'
import type { ReactNode } from 'react'

export function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="adm-section">
      <h3 className="adm-section-title">{title}</h3>
      {children}
    </section>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="adm-field-label">{label}</div>
      <div className="adm-value">{children}</div>
    </div>
  )
}

export function TextField({
  id,
  label,
  value,
  editable,
  onChange,
}: {
  id: string
  label: string
  value: string
  editable: boolean
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="adm-field-label">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        readOnly={!editable}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
