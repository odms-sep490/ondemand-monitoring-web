import { UserOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { authSession } from '../../../auth/api/authApi'
import { adminLayoutMessages } from '../../AdminLayout.messages'

/** Mini profile card pinned to the bottom of the sider. */
export function AdminSiderUserCard() {
  const { t } = useI18n(adminLayoutMessages)
  const user = authSession.getUser()
  return (
    <div className="mgr-side-user" title={user?.fullName ?? t.admin}>
      <Avatar size={38} icon={<UserOutlined aria-hidden="true" aria-label={undefined} />} aria-hidden="true" />
      <span className="mgr-side-user-text">
        <strong>{user?.fullName ?? t.admin}</strong>
        <span>{t.adminRole}</span>
      </span>
    </div>
  )
}
