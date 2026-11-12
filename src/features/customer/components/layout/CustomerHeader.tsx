import {
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Breadcrumb, Button, Input, Layout } from 'antd'

import { Icon } from '../../../../shared/components/Icon'
import { LanguageToggle } from '../../../../shared/components/LanguageToggle'
import { useI18n } from '../../../../shared/i18n'
import { customerLayoutMessages } from '../../CustomerLayout.messages'
import { customerHref } from '../../routes'
import { CustomerUserMenu } from './CustomerUserMenu'
import { NotificationBell } from '../../../notifications/NotificationBell'

type Props = {
  breadcrumb: string
  collapsed: boolean
  dark: boolean
  onToggleSider: () => void
  onToggleTheme: () => void
}

export function CustomerHeader({
  breadcrumb,
  collapsed,
  dark,
  onToggleSider,
  onToggleTheme,
}: Props) {
  const { t } = useI18n(customerLayoutMessages)
  return (
    <Layout.Header className="mgr-header cus-header-bar">
      <a
        className={`cus-header-brand${collapsed ? ' is-collapsed' : ''}`}
        href={customerHref({ screen: 'dashboard' })}
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
          className="mgr-icon-btn"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          aria-label={collapsed ? t.openNav : t.closeNav}
          onClick={onToggleSider}
        />
        <Breadcrumb
          className="cus-header-breadcrumb"
          items={[
            {
              title: (
                <a href={customerHref({ screen: 'dashboard' })}>{t.customer}</a>
              ),
            },
            { title: breadcrumb },
          ]}
        />
      </div>
      <div className="cus-header-actions">
        <Input
          className="mgr-search"
          allowClear
          prefix={<SearchOutlined aria-hidden="true" aria-label={undefined} />}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
        />
        <span className="cus-header-divider" aria-hidden="true" />
        <Button
          href="#help"
          type="default"
          className="mgr-support-btn"
          icon={<QuestionCircleOutlined />}
          aria-label={t.helpLink}
        >
          <span className="mgr-support-label">{t.headerHelp}</span>
        </Button>
        <NotificationBell
          role="CUSTOMER"
          className="cus-header-notifications"
        />
        <LanguageToggle className="mgr-lang-toggle" />
        <Button
          type="text"
          className="mgr-icon-btn"
          aria-label={t.toggleTheme}
          icon={<Icon name={dark ? 'sun' : 'moon'} width={18} height={18} />}
          onClick={onToggleTheme}
        />
        <div className="cus-header-user">
          <CustomerUserMenu />
          <DownOutlined aria-hidden="true" />
        </div>
      </div>
    </Layout.Header>
  )
}
