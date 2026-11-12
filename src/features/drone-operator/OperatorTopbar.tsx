import {
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Breadcrumb, Button, Input, Layout } from 'antd'

import { Icon } from '../../shared/components/Icon'
import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { PortalUserMenu } from '../../shared/components/portal/PortalUserMenu'
import { useI18n } from '../../shared/i18n'
import { operatorHref } from './routes'
import { operatorTopbarMessages } from './OperatorTopbar.messages'
import { NotificationBell } from '../notifications/NotificationBell'

export function OperatorTopbar({
  breadcrumb,
  collapsed,
  dark,
  onToggleDark,
  onToggleNavigation,
  searchQuery,
  onSearchChange,
}: {
  breadcrumb: string
  collapsed: boolean
  dark: boolean
  onToggleDark: () => void
  onToggleNavigation: () => void
  searchQuery: string
  onSearchChange: (value: string) => void
}) {
  const { t } = useI18n(operatorTopbarMessages)
  return (
    <Layout.Header className="mgr-header cus-header-bar odm-opr-topbar">
      <a
        className={`cus-header-brand${collapsed ? ' is-collapsed' : ''}`}
        href={operatorHref({ screen: 'missions' })}
        aria-label="OnDemand Monitor"
      >
        <span className="cus-header-brand-mark">
          <img src="/images/logo-new.png" alt="" />
        </span>
        <span className="cus-header-brand-name" aria-hidden="true">
          <span>OnDemand</span>
          <strong>Monitor</strong>
        </span>
      </a>
      <div className="cus-header-nav">
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
          className="cus-header-breadcrumb odm-opr-breadcrumb"
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

      <div className="cus-header-actions">
        <Input
          className="mgr-search odm-opr-search"
          allowClear
          prefix={<SearchOutlined aria-hidden="true" aria-label={undefined} />}
          placeholder={t.searchPlaceholder}
          aria-label={t.search}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <span className="cus-header-divider" aria-hidden="true" />
        <Button
          href={operatorHref({ screen: 'maintenance' })}
          type="default"
          className="mgr-support-btn"
          icon={<ToolOutlined />}
          aria-label={t.maintenanceLink}
        >
          <span className="mgr-support-label">{t.maintenanceLink}</span>
        </Button>
        <NotificationBell
          role="STAFF"
          className="cus-header-notifications"
        />
        <LanguageToggle className="mgr-lang-toggle" />
        <Button
          type="text"
          className="mgr-icon-btn"
          aria-label={t.toggleTheme}
          onClick={onToggleDark}
          icon={<Icon name={dark ? 'sun' : 'moon'} width={18} height={18} />}
        />
        <div className="cus-header-user">
          <PortalUserMenu
            fallbackName={t.pilotLabel}
            profileHref={operatorHref({ screen: 'profile' })}
          />
          <DownOutlined aria-hidden="true" />
        </div>
      </div>
    </Layout.Header>
  )
}
