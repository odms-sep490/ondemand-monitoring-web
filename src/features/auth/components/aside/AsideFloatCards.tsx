import { Icon, type IconName } from '../../../../shared/components/Icon'

export type AsideValueProp = {
  icon: IconName
  text: string
}

/**
 * Glassmorphism chips, one per value prop, each floating up/down with a
 * staggered delay. The icon is decorative (aria-hidden); the copy stays
 * real, readable DOM text so screen readers get the same information as
 * sighted users.
 */
export function AsideFloatCards({
  items,
}: {
  items: readonly AsideValueProp[]
}) {
  return (
    <ul className="odm-aside-cards">
      {items.map((item, index) => (
        <li
          key={item.text}
          className="odm-aside-card"
          style={{ animationDelay: `${index * 0.45}s` }}
        >
          <span className="odm-aside-card-icon" aria-hidden="true">
            <Icon name={item.icon} />
          </span>
          <strong className="odm-aside-card-text">{item.text}</strong>
        </li>
      ))}
    </ul>
  )
}
