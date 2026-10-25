import type { Dispatch, SetStateAction } from 'react'

export function ReadonlyBanner({
  setViewStage,
}: {
  setViewStage: Dispatch<
    SetStateAction<
      'intake' | 'criteria' | 'decision' | 'deposit' | 'planning' | null
    >
  >
}) {
  return (
    <div className="odm-or-readonly-banner" role="status">
      <strong>Bạn đang xem lại bước đã hoàn thành</strong>
      <span>Thông tin này đã được xác nhận và hiện chỉ có thể xem.</span>
      <button
        type="button"
        className="odm-btn odm-btn-p"
        onClick={() => setViewStage(null)}
      >
        Quay lại bước hiện tại
      </button>
    </div>
  )
}
