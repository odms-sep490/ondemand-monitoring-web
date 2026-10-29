import { Input } from 'antd'
import type { CSSProperties } from 'react'

export function WeatherField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  type = 'text',
  style,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suffix?: string
  type?: string
  style?: CSSProperties
}) {
  return (
    <label className="stf-field" style={style}>
      <span className="stf-field-label">{label}</span>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        suffix={
          suffix ? <span className="stf-muted">{suffix}</span> : undefined
        }
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
