import { Menu, type MenuProps } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { adminLayoutMessages } from '../../AdminLayout.messages'
import { adminHref } from '../../routes'
import { NAV_ITEMS, type AdminNavItemKey } from './navConfig'

type Props = {
  activeKey: AdminNavItemKey | null
  pendingCount?: number
  /** Icon-rail mode: labels collapse into tooltips. */
  collapsed?: boolean
  onNavigate?: () => void
}

export function AdminSiderMenu({ activeKey, pendingCount = 0, collapsed, onNavigate }: Props) {
  const { t } = useI18n(adminLayoutMessages)

  const items: MenuProps['items'] = [
    {
      type: 'group',
      key: 'menu',
      label: <span className="mgr-menu-group">{t.menu}</span>,
      children: NAV_ITEMS.map((item) => {
        const active = item.key === activeKey
        const count = item.key === 'accounts' ? pendingCount : 0
        return {
          key: item.key,
          icon: item.icon,
          title: collapsed ? t.navItems[item.key] : undefined,
          label: (
            <a
              className="mgr-menu-link"
              href={adminHref(item.route)}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
            >
              <span>{t.navItems[item.key]}</span>
              {count > 0 ? <span className="mgr-menu-count">{count}</span> : null}
            </a>
          ),
        }
      }),
    },
  ]

  return (
    <Menu
      mode="inline"
      inlineCollapsed={collapsed}
      theme="light"
      items={items}
      selectedKeys={activeKey ? [activeKey] : []}
      className="mgr-menu"
      aria-label={t.nav}
    />
  )
}
