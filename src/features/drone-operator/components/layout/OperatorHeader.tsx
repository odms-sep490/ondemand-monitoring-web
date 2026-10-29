import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Breadcrumb, Button, Input, Layout } from 'antd'

import { Icon } from '../../../../shared/components/Icon'
import { LanguageToggle } from '../../../../shared/components/LanguageToggle'
import { useI18n } from '../../../../shared/i18n'
import { operatorTopbarMessages } from '../../OperatorTopbar.messages'
import { operatorHref } from '../../routes'
import { OperatorUserMenu } from './OperatorUserMenu'

type Props = {
  breadcrumb: string
  collapsed: boolean
  dark: boolean
  searchQuery: string
  onSearchChange: (value: string) => void
  onToggleSider: () => void
  onToggleTheme: () => void
}

export function OperatorHeader({
  breadcrumb,
  collapsed,
  dark,
  searchQuery,
  onSearchChange,
  onToggleSider,
  onToggleTheme,
}: Props) {
  const { t } = useI18n(operatorTopbarMessages)
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
              title: (
                <a href={operatorHref({ screen: 'missions' })}>{t.pilotLabel}</a>
              ),
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
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
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
        <LanguageToggle className="mgr-lang-toggle" />
        <Button
          type="text"
          className="mgr-icon-btn"
          aria-label={t.toggleTheme}
          icon={<Icon name={dark ? 'sun' : 'moon'} width={18} height={18} />}
          onClick={onToggleTheme}
        />
        <OperatorUserMenu />
      </div>
    </Layout.Header>
  )
}
