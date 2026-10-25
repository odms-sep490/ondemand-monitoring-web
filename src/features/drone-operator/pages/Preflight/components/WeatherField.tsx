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
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        minWidth: 0,
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--tx2)',
        ...style,
      }}
    >
      {label}
      <span style={{ position: 'relative', display: 'block' }}>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          style={{
            width: '100%',
            height: 38,
            border: '1px solid var(--bd)',
            borderRadius: 8,
            padding: suffix ? '0 48px 0 10px' : '0 10px',
            background: '#fff',
            color: 'var(--tx)',
            boxSizing: 'border-box',
          }}
        />
        {suffix ? (
          <span
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--tx3)',
              fontSize: 11,
              fontWeight: 700,
              pointerEvents: 'none',
            }}
          >
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  )
}
