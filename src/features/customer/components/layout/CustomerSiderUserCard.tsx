import { UserOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { authSession } from '../../../auth/api/authApi'
import { customerLayoutMessages } from '../../CustomerLayout.messages'

/** Mini profile card pinned to the bottom of the sider. */
export function CustomerSiderUserCard() {
  const { t } = useI18n(customerLayoutMessages)
  const user = authSession.getUser()
  return (
    <a className="mgr-side-user" href="#profile" title={user?.fullName ?? t.customer}>
      <Avatar size={38} icon={<UserOutlined />} aria-hidden="true" />
      <span className="mgr-side-user-text">
        <strong>{user?.fullName ?? t.customer}</strong>
        <span>{t.customer}</span>
      </span>
    </a>
  )
}
