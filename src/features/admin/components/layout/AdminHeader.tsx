import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Breadcrumb, Button, Input, Layout } from 'antd'

import { Icon } from '../../../../shared/components/Icon'
import { LanguageToggle } from '../../../../shared/components/LanguageToggle'
import { useI18n } from '../../../../shared/i18n'
import { adminLayoutMessages } from '../../AdminLayout.messages'
import { adminHref } from '../../routes'
import { AdminUserMenu } from './AdminUserMenu'
import { NotificationBell } from '../../../notifications/NotificationBell'

type Props = {
  breadcrumb: string
  collapsed: boolean
  dark: boolean
  onToggleSider: () => void
  onToggleTheme: () => void
}

export function AdminHeader({
  breadcrumb,
  collapsed,
  dark,
  onToggleSider,
  onToggleTheme,
}: Props) {
  const { t } = useI18n(adminLayoutMessages)
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
            {
              title: <a href={adminHref({ screen: 'accounts' })}>{t.admin}</a>,
            },
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
          aria-label={t.search}
        />
        <LanguageToggle className="mgr-lang-toggle" />
        <NotificationBell role="ADMIN" />
        <Button
          type="text"
          className="mgr-icon-btn"
          aria-label={t.toggleTheme}
          icon={<Icon name={dark ? 'sun' : 'moon'} width={18} height={18} />}
          onClick={onToggleTheme}
        />
        <AdminUserMenu />
      </div>
    </Layout.Header>
  )
}
