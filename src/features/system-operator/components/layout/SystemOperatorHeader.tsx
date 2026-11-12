import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Breadcrumb, Button, Layout } from 'antd'

import { Icon } from '../../../../shared/components/Icon'
import { LanguageToggle } from '../../../../shared/components/LanguageToggle'
import { useI18n } from '../../../../shared/i18n'
import { systemOperatorLayoutMessages } from '../../SystemOperatorLayout.messages'
import { SystemOperatorUserMenu } from './SystemOperatorUserMenu'

type Props = {
  breadcrumb: string
  collapsed: boolean
  dark: boolean
  onToggleSider: () => void
  onToggleTheme: () => void
}

export function SystemOperatorHeader({
  breadcrumb,
  collapsed,
  dark,
  onToggleSider,
  onToggleTheme,
}: Props) {
  const { t } = useI18n(systemOperatorLayoutMessages)
  return (
    <Layout.Header className="mgr-header">
      <div className="mgr-header-left">
        <Button
          type="text"
          className="mgr-icon-btn"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          aria-label={collapsed ? t.openMenu : t.closeMenu}
          onClick={onToggleSider}
        />
        <Breadcrumb
          items={[
            {
              title: <a href="#portal/staff/technical">{t.roleLabel}</a>,
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
        <SystemOperatorUserMenu />
      </div>
    </Layout.Header>
  )
}
