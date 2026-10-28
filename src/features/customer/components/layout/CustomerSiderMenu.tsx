import { Menu, type MenuProps } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { customerLayoutMessages } from '../../CustomerLayout.messages'
import { customerHref } from '../../routes'
import { NAV_GROUPS, type CustomerNavItemKey } from './navConfig'

type Props = {
  activeKey: CustomerNavItemKey | null
  newMediaCount?: number
  /** Icon-rail mode: labels collapse into tooltips. */
  collapsed?: boolean
  onNavigate?: () => void
}

export function CustomerSiderMenu({ activeKey, newMediaCount, collapsed, onNavigate }: Props) {
  const { t } = useI18n(customerLayoutMessages)

  const items: MenuProps['items'] = NAV_GROUPS.map((group) => ({
    type: 'group',
    key: group.key,
    label: <span className="mgr-menu-group">{t.groups[group.key]}</span>,
    children: group.items.map((item) => {
      const active = item.key === activeKey
      const count = item.newMediaBadge ? newMediaCount : undefined
      return {
        key: item.key,
        icon: item.icon,
        title: collapsed ? t.navItems[item.key] : undefined,
        label: (
          <a
            className="mgr-menu-link"
            href={item.href || (item.route ? customerHref(item.route) : '#')}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
          >
            <span>{t.navItems[item.key]}</span>
            {typeof count === 'number' && count > 0 ? (
              <span className="mgr-menu-count odm-cus-navc">{count}</span>
            ) : null}
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
      aria-label={t.nav}
    />
  )
}
