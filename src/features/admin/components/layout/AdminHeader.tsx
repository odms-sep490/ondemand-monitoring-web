import {
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Breadcrumb, Button, Layout } from 'antd'

import { Icon } from '../../../../shared/components/Icon'
import { LanguageToggle } from '../../../../shared/components/LanguageToggle'
import { useI18n } from '../../../../shared/i18n'
import { adminLayoutMessages } from '../../AdminLayout.messages'
import { adminHref } from '../../routes'
import { AdminUserMenu } from './AdminUserMenu'

type Props = {
  breadcrumb: string
  collapsed: boolean
  /** Below 768px the menu lives in a Drawer instead of the Sider. */
  mobile: boolean
  dark: boolean
  onToggleSider: () => void
  onToggleTheme: () => void
}

export function AdminHeader({
  breadcrumb,
  collapsed,
  mobile,
  dark,
  onToggleSider,
  onToggleTheme,
}: Props) {
  const { t } = useI18n(adminLayoutMessages)
  const toggleIcon = mobile ? (
    <MenuOutlined aria-hidden="true" aria-label={undefined} />
  ) : collapsed ? (
    <MenuUnfoldOutlined aria-hidden="true" aria-label={undefined} />
  ) : (
    <MenuFoldOutlined aria-hidden="true" aria-label={undefined} />
  )
  return (
    <Layout.Header className="mgr-header">
      <div className="mgr-header-left">
        <Button
          type="text"
          className="mgr-icon-btn"
          icon={toggleIcon}
          aria-label={mobile || collapsed ? t.openNav : t.closeNav}
          onClick={onToggleSider}
        />
        <Breadcrumb
          items={[
            {
              title: (
                <a href={adminHref({ screen: 'dashboard' })}>{t.adminRole}</a>
              ),
            },
            { title: breadcrumb },
          ]}
        />
      </div>
      <div className="mgr-header-right">
        <LanguageToggle className="mgr-lang-toggle" />
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
