import {
  BellOutlined,
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

type Props = {
  breadcrumb: string
  collapsed: boolean
  dark: boolean
  onToggleSider: () => void
  onToggleTheme: () => void
}

export function CustomerHeader({ breadcrumb, collapsed, dark, onToggleSider, onToggleTheme }: Props) {
  const { t } = useI18n(customerLayoutMessages)
  return (
    <Layout.Header className="mgr-header">
      <div className="mgr-header-left">
        <Button
          type="text"
          className="mgr-icon-btn"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          aria-label={collapsed ? t.openNav : t.closeNav}
          onClick={onToggleSider}
        />
        <Breadcrumb
          items={[
            { title: <a href={customerHref({ screen: 'dashboard' })}>{t.customer}</a> },
            { title: breadcrumb },
          ]}
        />
      </div>
      <div className="mgr-header-right">
        <Input
          className="mgr-search"
          allowClear
          prefix={<SearchOutlined aria-hidden="true" aria-label={undefined} />}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
        />
        <Button
          href="#help"
          type="default"
          className="mgr-support-btn"
          icon={<QuestionCircleOutlined />}
          aria-label={t.helpLink}
        >
          <span className="mgr-support-label">{t.helpLink}</span>
        </Button>
        <a
          className="mgr-icon-btn"
          href={customerHref({ screen: 'notifications' })}
          aria-label={t.navItems.notifications}
        >
          <BellOutlined style={{ fontSize: 18, color: 'inherit' }} />
        </a>
        <LanguageToggle className="mgr-lang-toggle" />
        <Button
          type="text"
          className="mgr-icon-btn"
          aria-label={t.toggleTheme}
          icon={<Icon name={dark ? 'sun' : 'moon'} width={18} height={18} />}
          onClick={onToggleTheme}
        />
        <CustomerUserMenu />
      </div>
    </Layout.Header>
  )
}
