import { LogoutOutlined } from '@ant-design/icons'
import { Avatar, Button, Divider, Dropdown, theme } from 'antd'
import { useState } from 'react'

import { useI18n } from '../../i18n'
import { authSession } from '../../../features/auth/api/authApi'
import { logout } from '../../../features/auth/api/logout'
import { logoutButtonMessages } from '../../../features/auth/components/LogoutButton.messages'

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** Shared avatar menu for the customer, manager and staff portal headers. */
export function PortalUserMenu({
  fallbackName,
  profileHref = '#profile',
}: {
  fallbackName: string
  profileHref?: string
}) {
  const { t } = useI18n(logoutButtonMessages)
  const { token } = theme.useToken()
  const [pending, setPending] = useState(false)
  const user = authSession.getUser()

  const handleLogout = async () => {
    setPending(true)
    try {
      await logout()
    } finally {
      setPending(false)
    }
  }

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      popupRender={() => (
        <div
          style={{
            background: token.colorBgElevated,
            color: token.colorText,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadowSecondary,
            overflow: 'hidden',
            minWidth: 240,
          }}
        >
          <a
            href={profileHref}
            className="mgr-user-info"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <p className="mgr-user-name">{user?.fullName ?? fallbackName}</p>
            <p className="mgr-user-email">{user?.email ?? ''}</p>
          </a>
          <Divider style={{ margin: 0, borderColor: token.colorBorderSecondary }} />
          <div style={{ padding: 8 }}>
            <Button
              type="primary"
              danger
              block
              icon={<LogoutOutlined />}
              loading={pending}
              onClick={handleLogout}
              className="font-bold"
            >
              {pending ? t.loggingOut : t.logout}
            </Button>
          </div>
        </div>
      )}
    >
      <button
        type="button"
        className="mgr-avatar-btn"
        aria-label={user?.fullName ?? fallbackName}
      >
        <Avatar size={34} className="mgr-avatar">
          {initialsOf(user?.fullName)}
        </Avatar>
      </button>
    </Dropdown>
  )
}
