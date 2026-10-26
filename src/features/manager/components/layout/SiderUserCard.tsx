import { UserOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { authSession } from '../../../auth/api/authApi'
import { managerLayoutMessages } from '../../ManagerLayout.messages'

/** Mini profile card pinned to the bottom of the sider. */
export function SiderUserCard() {
  const { t } = useI18n(managerLayoutMessages)
  const user = authSession.getUser()
  return (
    <a className="mgr-side-user" href="#profile">
      <Avatar size={38} icon={<UserOutlined />} aria-hidden="true" />
      <span className="mgr-side-user-text">
        <strong>{user?.fullName ?? t.manager}</strong>
        <span>{t.manager}</span>
      </span>
    </a>
  )
}
