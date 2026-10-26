import { Menu, type MenuProps } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { managerHref } from '../../routes'
import { managerLayoutMessages } from '../../ManagerLayout.messages'
import { ManagerIcon } from '../common/ManagerIcon'
import {
  NAV_GROUPS,
  type ManagerNavCounts,
  type SidebarKey,
} from './navConfig'

type Props = {
  activeLabel: SidebarKey | ''
  counts?: ManagerNavCounts
  onNavigate?: () => void
}

export function SiderMenu({ activeLabel, counts, onNavigate }: Props) {
  const { t } = useI18n(managerLayoutMessages)

  const items: MenuProps['items'] = NAV_GROUPS.map((group) => ({
    type: 'group',
    key: group.label,
    label: <span className="mgr-menu-group">{t.sidebar[group.label]}</span>,
    children: group.items.map((item) => {
      const active = item.label === activeLabel
      const count = item.countKey ? counts?.[item.countKey] : undefined
      return {
        key: item.label,
        icon: <ManagerIcon name={item.icon} />,
        label: (
          <a
            className="mgr-menu-link"
            href={item.href || (item.route ? managerHref(item.route) : '#')}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
          >
            <span>{t.sidebar[item.label]}</span>
            {typeof count === 'number' && count > 0 ? (
              <span className="mgr-menu-count">{count}</span>
            ) : null}
          </a>
        ),
      }
    }),
  }))

  return (
    <Menu
      mode="inline"
      theme="light"
      items={items}
      selectedKeys={activeLabel ? [activeLabel] : []}
      className="mgr-menu"
      aria-label={t.nav}
    />
  )
}
