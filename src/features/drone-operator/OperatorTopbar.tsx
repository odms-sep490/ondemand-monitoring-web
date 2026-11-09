import {
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Badge, Breadcrumb, Button, Input, Layout } from 'antd'

import { Icon } from '../../shared/components/Icon'
import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { PortalUserMenu } from '../../shared/components/portal/PortalUserMenu'
import { useI18n } from '../../shared/i18n'
import { operatorHref } from './routes'
import { operatorTopbarMessages } from './OperatorTopbar.messages'

export function OperatorTopbar({
  breadcrumb,
  collapsed,
  dark,
  notificationCount,
  onToggleDark,
  onToggleNavigation,
  searchQuery,
  onSearchChange,
}: {
  breadcrumb: string
  collapsed: boolean
  dark: boolean
  notificationCount?: number
  onToggleDark: () => void
  onToggleNavigation: () => void
  searchQuery: string
  onSearchChange: (value: string) => void
}) {
  const { t } = useI18n(operatorTopbarMessages)
  return (
    <Layout.Header className="mgr-header odm-opr-topbar">
      <div className="mgr-header-left">
        <Button
          type="text"
          className="mgr-icon-btn odm-opr-menu-toggle"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          aria-label={collapsed ? t.openMenu : t.closeMenu}
          aria-controls="operator-navigation"
          aria-expanded={!collapsed}
          onClick={onToggleNavigation}
        />
        <Breadcrumb
          className="odm-opr-breadcrumb"
          items={[
            {
              title: (
                <a href={operatorHref({ screen: 'missions' })}>
                  {t.pilotLabel}
                </a>
              ),
            },
            { title: <strong>{breadcrumb}</strong> },
          ]}
        />
      </div>

      <div className="mgr-header-right">
        <Input
          className="mgr-search odm-opr-search"
          allowClear
          prefix={<SearchOutlined />}
          placeholder={t.searchPlaceholder}
          aria-label={t.search}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Button
          href={operatorHref({ screen: 'maintenance' })}
          type="default"
          className="mgr-support-btn"
          icon={<ToolOutlined />}
          aria-label={t.maintenanceLink}
        >
          <span className="mgr-support-label">{t.maintenanceLink}</span>
        </Button>
        <a
          className="mgr-icon-btn"
          href={operatorHref({ screen: 'notifications' })}
          aria-label={t.notifications}
        >
          <Badge count={notificationCount ?? 0} size="small" overflowCount={99}>
            <BellOutlined style={{ fontSize: 18, color: 'inherit' }} />
          </Badge>
        </a>
        <LanguageToggle className="mgr-lang-toggle" />
        <Button
          type="text"
          className="mgr-icon-btn"
          aria-label={t.toggleTheme}
          onClick={onToggleDark}
          icon={<Icon name={dark ? 'sun' : 'moon'} width={18} height={18} />}
        />
        <PortalUserMenu
          fallbackName={t.pilotLabel}
          profileHref={operatorHref({ screen: 'profile' })}
        />
      </div>
    </Layout.Header>
  )
}
