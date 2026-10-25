import type { ExecutionPlan } from '../../../types/planning'
import type { OrderChecklistSnapshot } from '../../../types/orders'

export function ExecutionPlanSummary({
  plan,
}: {
  plan: ExecutionPlan
  items: OrderChecklistSnapshot[]
}) {
  const coverage = plan.coverage
  return (
    <section aria-label="Execution plan summary">
      <dl className="odm-planning-metrics">
        <div>
          <dt>Yêu cầu</dt>
          <dd>{coverage.total}</dd>
        </div>
        <div>
          <dt>Đã phân công</dt>
          <dd>{coverage.covered}</dd>
        </div>
        <div>
          <dt>Còn lại</dt>
          <dd>{coverage.uncovered}</dd>
        </div>
      </dl>
    </section>
  )
}
