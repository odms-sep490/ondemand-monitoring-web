import { AreaDecisionSummary } from './AreaDecisionSummary'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { Fact } from './AreaFact'
import {
  ministryLabel,
  restrictedLabel,
  distanceLabel,
  metersLabel,
  openMinistryMap,
} from '../areaHelpers'
import { ManagerAreaReview } from './ManagerAreaReview'
import type {
  FlightAreaAssessment,
  FlightAreaFindingSeverity,
} from '../../../../customer/api/customerApi'
import type { OrderDetail } from '../../../types/orders'
import type { SavedAreaReview } from '../areaTypes'
import type { Dispatch, SetStateAction } from 'react'

export function AreaAssessmentBody({
  data,
  hasMinistryViolations,
  ministryViolatedZones,
  findings,
  hasAssessmentData,
  order,
  review,
  setReviewOpen,
}: {
  data: FlightAreaAssessment
  hasMinistryViolations: boolean
  ministryViolatedZones: string[]
  findings:
    | { code: string; severity: FlightAreaFindingSeverity; message: string }[]
    | undefined
  hasAssessmentData: boolean
  order: OrderDetail
  review: SavedAreaReview | null
  setReviewOpen: Dispatch<SetStateAction<boolean>>
}) {
  return (
    <>
      {hasAssessmentData ? <AreaDecisionSummary data={data} /> : null}
      {hasAssessmentData ? (
        <details className="odm-or-area-details">
          <summary>
            <OrderIcon name="doc" size={18} />
            <span>Xem dữ liệu kiểm tra chi tiết</span>
            <span className="odm-or-area-chevron" aria-hidden="true">
              <OrderIcon name="chevron-right" size={18} />
            </span>
          </summary>
          <dl className="odm-or-area-facts">
            {data.ministryFlightBan?.available ? (
              <Fact
                label="Đối chiếu bản đồ Bộ Quốc phòng"
                value={ministryLabel(data.ministryFlightBan)}
              />
            ) : null}
            <Fact
              label="Dữ liệu vùng cấm nội bộ"
              value={restrictedLabel(data.restrictedZones)}
            />
            <Fact
              label="Khoảng cách tới vùng cấm gần nhất"
              value={distanceLabel(
                data.restrictedZones.nearestRestrictedZoneDistanceMeters,
              )}
            />
            <Fact
              label="Độ cao mặt đất tại vị trí"
              value={metersLabel(data.elevation.terrainElevationMeters)}
            />
            <Fact
              label="Công trình trong khu vực"
              value={String(data.osmContext.buildingCount ?? 0)}
            />
            <Fact
              label="Có sân bay gần khu vực"
              value={data.osmContext.aerodromeNearby ? 'Có' : 'Không'}
            />
            <Fact
              label="Có bãi đáp trực thăng gần khu vực"
              value={data.osmContext.helipadNearby ? 'Có' : 'Không'}
            />
          </dl>
        </details>
      ) : null}
      {hasMinistryViolations ? (
        <div className="odm-or-area-findings">
          <strong>Vùng cần đối chiếu</strong>
          <ul>
            {ministryViolatedZones.map((zone) => (
              <li key={zone} className="is-high odm-or-area-zone-row">
                <code>{zone}</code>
                <button
                  type="button"
                  className="odm-or-area-zone-link"
                  title={`Mở cambay.mod.gov.vn và sao chép mã ${zone}`}
                  onClick={() => openMinistryMap(zone)}
                >
                  Xem trên bản đồ
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {findings && findings.length > 0 ? (
        <div className="odm-or-area-findings">
          <strong>Cảnh báo cần xem xét</strong>
          <ul>
            {findings.map((finding) => (
              <li
                key={finding.code}
                className={`is-${finding.severity.toLowerCase()}`}
              >
                {finding.message}
              </li>
            ))}
          </ul>
        </div>
      ) : !hasMinistryViolations && data.assessment.level === 'FAVORABLE' ? (
        <div className="odm-or-area-clear">
          <span className="odm-or-area-clear-icon" aria-hidden="true">
            <OrderIcon name="check" size={14} />
          </span>
          <div>
            <strong>Kiểm tra sơ bộ chưa ghi nhận cảnh báo.</strong>
            <small>
              Manager vẫn cần xác nhận điều kiện thực tế trước khi duyệt.
            </small>
          </div>
        </div>
      ) : null}
      {(findings && findings.length > 0) || hasMinistryViolations ? (
        <p className="odm-or-area-disclaimer">{data.assessment.disclaimer}</p>
      ) : null}
      {data.ministryFlightBan?.available ? (
        <a
          className="odm-or-area-source"
          href={data.ministryFlightBan.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          <OrderIcon name="plane" size={18} />
          <span>Mở bản đồ cấm bay của Bộ Quốc phòng</span>
          <OrderIcon name="chevron-right" size={18} />
        </a>
      ) : null}
      <ManagerAreaReview
        order={order}
        review={review}
        onEdit={() => setReviewOpen(true)}
      />
    </>
  )
}
