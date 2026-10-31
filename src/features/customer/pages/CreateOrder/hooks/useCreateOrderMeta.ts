import { useEffect, type Dispatch, type SetStateAction } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerApi } from '../../../api/customerApi'
import type { FormState } from '../../../lib/createOrder/types'

/**
 * Loads reference data from the BE: services + preferred times (once), the
 * deliverables of the chosen service. The live estimate is owned by the
 * checklist quote endpoint because it receives the complete pricing form state. Keeps the form
 * pointing at valid defaults when the lists arrive.
 */
export function useCreateOrderMeta(
  serviceId: string,
  setForm: Dispatch<SetStateAction<FormState>>,
) {
  const base = useApiQuery(
    (signal) =>
      Promise.all([
        customerApi.listServices(signal),
        customerApi.listPreferredTimes(signal),
      ]).then(([services, times]) => ({ services, times })),
    [],
  )
  const services = base.data?.services ?? []
  const preferredTimes = base.data?.times ?? []

  const deliverablesQuery = useApiQuery(
    (signal) =>
      serviceId
        ? customerApi.listServiceDeliverables(serviceId, signal)
        : Promise.resolve([]),
    [serviceId],
  )
  const deliverables = serviceId ? (deliverablesQuery.data ?? []) : []

  useEffect(() => {
    if (!base.data) return
    setForm((current) => ({
      ...current,
      serviceId: base.data!.services.some((service) => service.id === current.serviceId)
        ? current.serviceId
        : base.data?.services[0]?.id || '',
      // The customer picks the time window themselves (step 4 asks for it). Only a saved id that no longer exists is cleared.
      preferredTimeId: base.data!.times.some((time) => time.id === current.preferredTimeId)
        ? current.preferredTimeId
        : '',
    }))
  }, [base.data, setForm])

  useEffect(() => {
    if (!serviceId || !deliverablesQuery.data) return
    const items = deliverablesQuery.data
    setForm((current) => {
      const valid = items.some(
        (item) => item.deliverableTypeId === current.deliverableTypeId,
      )
      return valid
        ? current
        : { ...current, deliverableTypeId: items[0]?.deliverableTypeId || '' }
    })
  }, [deliverablesQuery.data, serviceId, setForm])

  return {
    services,
    preferredTimes,
    deliverables,
    pricingEstimate: null,
    pricingLoading: false,
    deliverablesLoading: Boolean(serviceId) && deliverablesQuery.loading,
    deliverablesError: serviceId ? deliverablesQuery.error : undefined,
    reloadDeliverables: deliverablesQuery.reload,
    loading: base.loading,
    error: base.error,
    reload: base.reload,
  }
}
