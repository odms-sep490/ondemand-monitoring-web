import { UserOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { authSession } from '../../../auth/api/authApi'
import { operatorSidebarMessages } from '../../OperatorSidebar.messages'
import { operatorTopbarMessages } from '../../OperatorTopbar.messages'
import { operatorHref } from '../../routes'

/** Mini profile card pinned to the bottom of the sider. */
export function OperatorSiderUserCard() {
  const { t } = useI18n(operatorSidebarMessages)
  const { t: tTop } = useI18n(operatorTopbarMessages)
  const user = authSession.getUser()
  return (
    <a
      className="mgr-side-user"
      href={operatorHref({ screen: 'profile' })}
      title={user?.fullName ?? t.pilotFallback}
    >
      <Avatar size={38} icon={<UserOutlined />} aria-hidden="true" />
      <span className="mgr-side-user-text">
        <strong>{user?.fullName ?? t.pilotFallback}</strong>
        <span>{tTop.pilotLabel}</span>
      </span>
    </a>
  )
}
