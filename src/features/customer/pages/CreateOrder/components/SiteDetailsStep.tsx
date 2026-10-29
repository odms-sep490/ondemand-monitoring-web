import type {
  FormErrors,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
import { MonitoringAuthorizationSection } from './MonitoringAuthorizationSection'
import { SiteDetailsPanel } from './SiteDetailsPanel'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
}

/** Operational site details and the customer's monitoring authorization. */
export function SiteDetailsStep({ form, errors, update }: Props) {
  return (
    <div className="co-stack co-site-details-step">
      <SiteDetailsPanel form={form} errors={errors} update={update} />
      <MonitoringAuthorizationSection
        form={form}
        errors={errors}
        update={update}
      />
    </div>
  )
}
