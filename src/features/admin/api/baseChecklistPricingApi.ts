import { apiRequest } from '../../../shared/api/httpClient'

export type BaseChecklistPriceRow = {
  checklistId: string
  name: string
  packageNames: string[]
  basePrice: number
  standardAreaM2: number | null
  extraImageUnitPrice?: number
  extraVideoUnitPrice?: number
  active: boolean
  version: number
  calculatedPrice: number | null
  calculationDisplay: string | null
  calculationError: string | null
}

export const baseChecklistPricingApi = {
  list(signal?: AbortSignal) {
    return apiRequest<BaseChecklistPriceRow[]>(
      '/api/admin/pricing/base-checklists',
      { signal },
    )
  },
  update(
    row: Pick<BaseChecklistPriceRow, 'checklistId' | 'basePrice' | 'standardAreaM2' | 'version'> & {
      extraImageUnitPrice: number
      extraVideoUnitPrice: number
    },
  ) {
    return apiRequest<BaseChecklistPriceRow>(
      `/api/admin/pricing/base-checklists/${encodeURIComponent(row.checklistId)}`,
      {
        method: 'PUT',
        body: {
          basePrice: row.basePrice,
          standardAreaM2: row.standardAreaM2,
          extraImageUnitPrice: row.extraImageUnitPrice,
          extraVideoUnitPrice: row.extraVideoUnitPrice,
          expectedVersion: row.version,
        },
      },
    )
  },
  preview(actualAreaM2: number) {
    return apiRequest<BaseChecklistPriceRow[]>(
      '/api/admin/pricing/base-checklists/preview',
      { method: 'POST', body: { actualAreaM2 } },
    )
  },
}
