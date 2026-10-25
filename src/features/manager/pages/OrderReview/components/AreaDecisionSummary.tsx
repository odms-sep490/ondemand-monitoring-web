import type { FlightAreaAssessment } from '../../../../customer/api/customerApi'
import { OrderIcon } from '../../../components/common/OrderIcon'

export function AreaDecisionSummary({ data }: { data: FlightAreaAssessment }) {
  const level = data.assessment.level
  const hasMinistryConflict =
    Boolean(data.ministryFlightBan?.violatedZones.length) ||
    (data.ministryFlightBan?.violatedAreaSquareMeters ?? 0) > 0
  const title =
    level === 'HIGH_RISK'
      ? 'Chưa nên duyệt khu vực này'
      : level === 'NEEDS_REVIEW'
        ? 'Cần kiểm tra thêm trước khi duyệt'
        : 'Chưa phát hiện trở ngại đáng kể'
  const guidance = hasMinistryConflict
    ? 'Bản đồ của Bộ Quốc phòng ghi nhận khu vực giao vùng cấm hoặc hạn chế bay. Hãy mở bản đồ, đối chiếu mã vùng bên dưới và xác nhận điều kiện trước khi duyệt.'
    : level === 'HIGH_RISK' || level === 'NEEDS_REVIEW'
      ? 'Hãy xem các cảnh báo bên dưới và xác nhận điều kiện thực tế trước khi duyệt.'
      : 'Bạn có thể tiếp tục xem các điều kiện duyệt khác. Điều kiện bay cuối cùng vẫn cần được xác nhận khi lập kế hoạch.'

  return (
    <div className={`odm-or-area-decision is-${level.toLowerCase()}`}>
      <span className="odm-or-area-decision-icon" aria-hidden="true">
        <OrderIcon
          name={
            level === 'HIGH_RISK'
              ? 'x'
              : level === 'NEEDS_REVIEW'
                ? 'alert'
                : 'check'
          }
          size={20}
        />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{guidance}</p>
      </div>
    </div>
  )
}
