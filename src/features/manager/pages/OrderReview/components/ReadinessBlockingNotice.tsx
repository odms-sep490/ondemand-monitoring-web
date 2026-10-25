import type {
  OrderReadiness,
  ReadinessCriterion,
} from '../../../types/readiness'
import { useMemo, useState } from 'react'
import type { FailureAction, SupplementRequest } from '../readinessTypes'

const supplementOptions: Record<
  string,
  Array<Omit<SupplementRequest, 'id'>>
> = {
  SERVICE_AREA: [
    { label: 'Chọn lại vị trí hoặc vùng giám sát', scope: 'LOCATION' },
  ],
  SITE_ACCESS: [
    {
      label: 'Giấy tờ chứng minh quyền sử dụng hoặc giấy ủy quyền tại khu vực',
      scope: 'ADDITIONAL_INFORMATION',
    },
  ],
  REQUESTED_SCOPE_FEASIBLE: [
    { label: 'Chọn lại vùng và bán kính giám sát', scope: 'LOCATION' },
  ],
  PURPOSE: [
    {
      label: 'Mô tả rõ mục đích sử dụng ảnh và dữ liệu',
      scope: 'ADDITIONAL_INFORMATION',
    },
  ],
}

export function ReadinessBlockingNotice({
  readiness,
  failedRequired,
  editable,
  savingCode,
  submitFailedDecision,
}: {
  readiness: OrderReadiness
  failedRequired: ReadinessCriterion[]
  editable: boolean
  savingCode: string | null
  submitFailedDecision: (
    decision: FailureAction,
    supplements?: SupplementRequest[],
  ) => Promise<void>
}) {
  const [showSupplementForm, setShowSupplementForm] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const availableOptions = useMemo(
    () =>
      failedRequired
        .filter((criterion) => criterion.code !== 'CAPABILITY')
        .flatMap((criterion) => {
        const options = supplementOptions[criterion.code] ?? [
          {
            label: `Bổ sung thông tin và tài liệu làm rõ: ${criterion.title}`,
            scope: 'ADDITIONAL_INFORMATION' as const,
          },
        ]
        return options.map((option, index) => ({
          ...option,
          id: `${criterion.code}-${index}`,
        }))
        }),
    [failedRequired],
  )
  const selectedRequests = availableOptions.filter((option) =>
    selected.includes(option.id),
  )

  return (
    <div
      className="odm-or-readiness-blocking"
      aria-label="Lý do chưa thể duyệt"
    >
      <ul>
        {readiness.blockingReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {failedRequired.length > 0 && editable ? (
        <div className="odm-or-readiness-blocking-actions">
          {availableOptions.length > 0 ? (
            <button
              type="button"
              className="odm-btn odm-btn-ok"
              disabled={savingCode === 'decision'}
              onClick={() => setShowSupplementForm(true)}
            >
              Yêu cầu bổ sung
            </button>
          ) : null}
          <button
            type="button"
            className="odm-btn odm-btn-rd"
            disabled={savingCode === 'decision'}
            onClick={() => void submitFailedDecision('REJECTED')}
          >
            Từ chối đơn
          </button>
        </div>
      ) : null}
      {showSupplementForm && availableOptions.length > 0 ? (
        <div className="odm-or-supplement-form">
          <fieldset>
            <legend>Chọn nội dung khách hàng cần bổ sung</legend>
            <p>Khách hàng sẽ nhìn thấy đúng các yêu cầu được chọn dưới đây.</p>
            <div className="odm-or-supplement-options">
              {availableOptions.map((option) => (
                <label key={option.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, option.id]
                          : current.filter((id) => id !== option.id),
                      )
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="odm-or-supplement-actions">
            <button
              type="button"
              className="odm-btn"
              disabled={savingCode === 'decision'}
              onClick={() => {
                setShowSupplementForm(false)
                setSelected([])
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={
                selectedRequests.length === 0 || savingCode === 'decision'
              }
              onClick={() =>
                void submitFailedDecision('NEED_INFO', selectedRequests)
              }
            >
              {savingCode === 'decision' ? 'Đang gửi…' : 'Gửi yêu cầu bổ sung'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
