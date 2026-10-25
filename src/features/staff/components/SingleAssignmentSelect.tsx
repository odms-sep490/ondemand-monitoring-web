import { useId } from 'react'

/** Extracted from StaffAssignmentPage's original single-device dropdown. */
export function SingleAssignmentSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  hint,
  required = false,
}: {
  label: string
  value: string
  options: { id: string; label: string }[]
  placeholder: string
  onChange: (value: string) => void
  hint?: string
  required?: boolean
}) {
  const hintId = useId()
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
      <select
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          width: '100%',
          border: '1px solid var(--border, var(--bd))',
          background: 'var(--surface, var(--sf))',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <small id={hintId}>{hint}</small>}
    </label>
  )
}
