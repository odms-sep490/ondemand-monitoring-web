import {
  CheckCircleOutlined,
  ControlOutlined,
  SendOutlined,
  ToolOutlined,
} from '@ant-design/icons'

import type { MissionStaffRole } from '../../../mission/types/mission'

const ICONS: Record<MissionStaffRole, typeof SendOutlined> = {
  PILOT: SendOutlined,
  OPERATOR: ControlOutlined,
  MAINTAINER: ToolOutlined,
  INSPECTOR: CheckCircleOutlined,
}

/** antd icon for a mission staff role (replaces emoji glyphs in copy). */
export function StaffRoleIcon({ role }: { role: MissionStaffRole }) {
  const Icon = ICONS[role]
  return <Icon aria-hidden="true" />
}
