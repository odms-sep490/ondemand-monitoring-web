import {
  AppstoreAddOutlined,
  CheckSquareOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { Button } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { adminHref } from '../../../routes'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'

const ICON = { 'aria-hidden': true, 'aria-label': undefined } as const

export function QuickActionsCard() {
  const { t } = useI18n(adminDashboardPageMessages)
  const q = t.quick
  return (
    <CardComponent
      title={q.title}
      icon={<ThunderboltOutlined aria-hidden="true" aria-label={undefined} />}
      tone="green"
    >
      <div className="adm-dash-quick">
        <Button
          icon={<UserAddOutlined {...ICON} />}
          href={adminHref({ screen: 'createAccount' })}
        >
          {q.createAccount}
        </Button>
        <Button
          icon={<RobotOutlined {...ICON} />}
          href={adminHref({ screen: 'devices' })}
        >
          {q.addDevice}
        </Button>
        <Button
          icon={<AppstoreAddOutlined {...ICON} />}
          href={adminHref({ screen: 'catalog' })}
        >
          {q.addService}
        </Button>
        <Button
          icon={<CheckSquareOutlined {...ICON} />}
          href={adminHref({ screen: 'checklists' })}
        >
          {q.checklists}
        </Button>
      </div>
    </CardComponent>
  )
}
