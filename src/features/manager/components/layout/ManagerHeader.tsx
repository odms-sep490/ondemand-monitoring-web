import {
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Badge, Breadcrumb, Button, Input, Layout } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { managerLayoutMessages } from '../../ManagerLayout.messages'
import { managerHref } from '../../routes'
import { ManagerIcon } from '../common/ManagerIcon'
import { UserMenu } from './UserMenu'

type Props = {
  breadcrumb: string
  collapsed: boolean
  dark: boolean
  pendingOrders?: number
  onToggleSider: () => void
  onToggleTheme: () => void
}

export function ManagerHeader({
  breadcrumb,
  collapsed,
  dark,
  pendingOrders,
  onToggleSider,
  onToggleTheme,
}: Props) {
  const { t } = useI18n(managerLayoutMessages)
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
            { title: <a href={managerHref({ screen: 'dashboard' })}>{t.manager}</a> },
            { title: breadcrumb },
          ]}
        />
      </div>
      <div className="mgr-header-right">
        <Input
          className="mgr-search"
          allowClear
          prefix={<SearchOutlined />}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
        />
        <Button
          href="#portal/manager/support"
          type="default"
          className="mgr-support-btn"
        >
          {t.sidebar.supportButton}
        </Button>
        <a
          className="mgr-icon-btn"
          href={managerHref({ screen: 'orderQueue' })}
          aria-label={t.notifications}
        >
          <Badge count={pendingOrders ?? 0} size="small" overflowCount={99}>
            <BellOutlined style={{ fontSize: 18, color: 'inherit' }} />
          </Badge>
        </a>
        <Button
          type="text"
          className="mgr-icon-btn"
          aria-label={t.toggleTheme}
          icon={<ManagerIcon name={dark ? 'sun' : 'moon'} />}
          onClick={onToggleTheme}
        />
        <UserMenu />
      </div>
    </Layout.Header>
  )
}
