import { Menu, type MenuProps } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { operatorHref } from '../../routes'
import { operatorSidebarMessages } from '../../OperatorSidebar.messages'
import { NAV_GROUPS, type OperatorNavItemKey } from './navConfig'

type Props = {
  activeKey: OperatorNavItemKey | null
  pendingCount?: number
  notificationCount?: number
  /** Icon-rail mode: labels collapse into tooltips. */
  collapsed?: boolean
  onNavigate?: () => void
}

export function OperatorSiderMenu({
  activeKey,
  pendingCount = 0,
  notificationCount = 0,
  collapsed,
  onNavigate,
}: Props) {
  const { t } = useI18n(operatorSidebarMessages)

  const items: MenuProps['items'] = NAV_GROUPS.map((group) => ({
    type: 'group',
    key: group.key,
    label: <span className="mgr-menu-group">{t.groups[group.key]}</span>,
    children: group.items.map((item) => {
      const active = item.key === activeKey
      const count =
        item.badge === 'pending'
          ? pendingCount
          : item.badge === 'notifications'
            ? notificationCount
            : 0
      return {
        key: item.key,
        icon: item.icon,
        title: collapsed ? t.nav[item.key] : undefined,
        label: (
          <a
            className="mgr-menu-link"
            href={operatorHref(item.route)}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
          >
            <span>{t.nav[item.key]}</span>
            {count > 0 ? <span className="mgr-menu-count">{count}</span> : null}
          </a>
        ),
      }
    }),
  }))

  return (
    <Menu
      mode="inline"
      inlineCollapsed={collapsed}
      theme="light"
      items={items}
      selectedKeys={activeKey ? [activeKey] : []}
      className="mgr-menu"
      aria-label={t.ariaNav}
    />
  )
}
