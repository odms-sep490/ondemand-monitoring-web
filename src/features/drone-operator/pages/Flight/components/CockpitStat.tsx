import { Ico } from './CockpitIcon'

export function Stat({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: string
  label: string
  value: string
  unit?: string
  tone?: string
}) {
  return (
    <div className={`fc-stat${tone ? ` is-${tone}` : ''}`}>
      <span className="fc-stat__icon">
        <Ico name={icon} size={22} />
      </span>
      <div>
        <span className="fc-stat__label">{label}</span>
        <strong>
          {value}
          {unit ? <small> {unit}</small> : null}
        </strong>
      </div>
    </div>
  )
}
