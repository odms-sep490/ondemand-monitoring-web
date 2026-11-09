import type { AvailableOperator } from '../../../staff/api/operatorApi'
import { staffInitials } from './liveDispatchHelpers'
import './pickers.css'

export function StaffAvatar({ staff }: { staff: AvailableOperator }) {
  return (
    <span aria-hidden="true" className="mgr-pk-avatar">
      {staffInitials(staff)}
    </span>
  )
}
