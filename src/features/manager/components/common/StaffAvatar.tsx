import type { AvailableOperator } from '../../../staff/api/operatorApi'
import { staffInitials } from './liveDispatchHelpers'

export function StaffAvatar({ staff }: { staff: AvailableOperator }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        display: 'inline-grid',
        placeItems: 'center',
        flex: '0 0 auto',
        background: '#dbeafe',
        color: '#1d4ed8',
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {staffInitials(staff)}
    </span>
  )
}
