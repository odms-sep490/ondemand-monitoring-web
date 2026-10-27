import { LogoutOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, Divider, theme } from 'antd'
import { useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { authSession } from '../../../auth/api/authApi'
import { logout } from '../../../auth/api/logout'
import { logoutButtonMessages } from '../../../auth/components/LogoutButton.messages'
import { managerLayoutMessages } from '../../ManagerLayout.messages'

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** Avatar dropdown: name / email block + danger logout button (reference pattern). */
export function UserMenu() {
  const { t } = useI18n(managerLayoutMessages)
  const { t: tLogout } = useI18n(logoutButtonMessages)
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
            href="#profile"
            className="mgr-user-info"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <p className="mgr-user-name">{user?.fullName ?? t.manager}</p>
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
              {pending ? tLogout.loggingOut : tLogout.logout}
            </Button>
          </div>
        </div>
      )}
    >
      <button
        type="button"
        className="mgr-avatar-btn"
        aria-label={user?.fullName ?? t.manager}
      >
        <Avatar size={34} className="mgr-avatar">
          {initialsOf(user?.fullName)}
        </Avatar>
      </button>
    </Dropdown>
  )
}
