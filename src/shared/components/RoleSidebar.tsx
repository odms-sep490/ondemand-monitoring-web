import { useId, type ReactNode } from 'react'

import './roleSidebar.css'

export type RoleSidebarItem = {
  key: string
  label: string
  icon: ReactNode
  className?: string
  href?: string
  active?: boolean
  badge?: ReactNode
  title?: string
  onClick?: () => void
}

export type RoleSidebarGroup = {
  key: string
  label: string
  items: RoleSidebarItem[]
}

export type RoleSidebarProfile = {
  name: string
  description?: string
  href?: string
  avatar?: ReactNode
}

type Props = {
  brandHref: string
  ariaLabel: string
  groups: RoleSidebarGroup[]
  profile?: RoleSidebarProfile
  footer?: ReactNode
  collapsed?: boolean
  className?: string
  onBrandClick?: () => void
}

function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function RoleSidebar({
  brandHref,
  ariaLabel,
  groups,
  profile,
  footer,
  collapsed = false,
  className,
  onBrandClick,
}: Props) {
  const id = useId()

  return (
    <div
      className={'app-role-sidebar' + (collapsed ? ' is-collapsed' : '') + (className ? ' ' + className : '')}
    >
      <a
        className="app-role-sidebar__brand"
        href={brandHref}
        aria-label="OnDemand Monitor"
        title={collapsed ? 'OnDemand Monitor' : undefined}
        onClick={onBrandClick}
      >
        <span className="app-role-sidebar__brand-mark">
          <img src="/images/logo-new.png" alt="" />
        </span>
        <span className="app-role-sidebar__brand-name" aria-hidden="true">
          <span>OnDemand</span>
          <strong>Monitor</strong>
        </span>
      </a>

      <div className="app-role-sidebar__scroll">
        <nav aria-label={ariaLabel}>
          {groups.map((group, groupIndex) => {
            const headingId = id + '-group-' + groupIndex
            return (
              <div
                className="app-role-sidebar__group"
                key={group.key}
                role="group"
                aria-labelledby={headingId}
              >
                <div
                  className="app-role-sidebar__group-label"
                  id={headingId}
                  title={collapsed ? group.label : undefined}
                >
                  {group.label}
                </div>
                <div className="app-role-sidebar__items">
                  {group.items.map((item) => {
                    const itemClass =
                      [
                        'app-role-sidebar__item',
                        item.className,
                        item.active ? 'is-active' : undefined,
                      ]
                        .filter(Boolean)
                        .join(' ')
                    const accessibleLabel = collapsed ? item.label : undefined
                    const contents = (
                      <>
                        <span className="app-role-sidebar__icon" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span className="app-role-sidebar__item-label">
                          {item.label}
                        </span>
                        {item.badge != null ? (
                          <span className="app-role-sidebar__badge">
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )

                    return item.href ? (
                      <a
                        key={item.key}
                        className={itemClass}
                        href={item.href}
                        aria-current={item.active ? 'page' : undefined}
                        aria-label={accessibleLabel}
                        title={item.title ?? (collapsed ? item.label : undefined)}
                        onClick={item.onClick}
                      >
                        {contents}
                      </a>
                    ) : (
                      <button
                        key={item.key}
                        className={itemClass}
                        type="button"
                        aria-current={item.active ? 'page' : undefined}
                        aria-label={accessibleLabel}
                        title={item.title ?? (collapsed ? item.label : undefined)}
                        onClick={item.onClick}
                      >
                        {contents}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      {footer ? (
        <div className="app-role-sidebar__footer">{footer}</div>
      ) : null}

      {profile ? (
        profile.href ? (
          <a
            className="app-role-sidebar__profile"
            href={profile.href}
            title={profile.name}
          >
            <span className="app-role-sidebar__avatar" aria-hidden="true">
              {profile.avatar ?? initialsFor(profile.name)}
            </span>
            <span className="app-role-sidebar__profile-copy">
              <strong>{profile.name}</strong>
              {profile.description ? <span>{profile.description}</span> : null}
            </span>
          </a>
        ) : (
          <div className="app-role-sidebar__profile">
            <span className="app-role-sidebar__avatar" aria-hidden="true">
              {profile.avatar ?? initialsFor(profile.name)}
            </span>
            <span className="app-role-sidebar__profile-copy">
              <strong>{profile.name}</strong>
              {profile.description ? <span>{profile.description}</span> : null}
            </span>
          </div>
        )
      ) : null}
    </div>
  )
}
