import type {
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import type {
  FormErrors,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
import type { ChecklistRow } from '../../../lib/checklist/types'
import { PricingEstimateCard } from './PricingEstimateCard'
import { RequestInfoPanel } from './RequestInfoPanel'
import { ServicePicker } from './ServicePicker'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  services: ServiceOption[]
  servicesLoading: boolean
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
  additionalChecklists: ChecklistRow[]
}

/** Step 1: choose the core monitoring service. */
export function ServiceStep(p: Props) {
  const selected = p.services.find((s) => s.id === p.form.serviceId)

  return (
    <div className="co-grid is-service">
      <div className="co-stack">
        <ServicePicker
          services={p.services}
          loading={p.servicesLoading}
          selectedId={p.form.serviceId}
          error={p.errors.serviceId}
          onSelect={(id) => p.update('serviceId', id)}
        />
      </div>
      <aside className="co-stack co-summary is-tall">
        <RequestInfoPanel form={p.form} errors={p.errors} update={p.update} />
        <PricingEstimateCard
          estimate={p.pricingEstimate}
          loading={p.pricingLoading}
          hasService={Boolean(selected)}
          additionalChecklists={p.additionalChecklists}
        />
      </aside>
    </div>
  )
}
