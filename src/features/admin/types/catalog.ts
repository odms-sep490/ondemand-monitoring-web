import type { PreferredTimeCode } from '../api/catalogApi'

export type AdminService = {
  id: string
  name: string
  description: string
  /** Legacy catalog price; only the price while no default checklist is priced. */
  basePrice: number
  /** Sum of the default checklists (or the legacy price while none is priced). */
  defaultPrice?: number
  priceSource?: 'CHECKLISTS' | 'UNPRICED'
  imageUrl?: string | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export type AdminTimeslot = {
  id: string
  code: PreferredTimeCode
  name: string
  /** "HH:mm" */
  startTime: string
  /** "HH:mm" */
  endTime: string
}

export type AdminStation = {
  id: string
  code: string
  name: string
  address: string
  lat: number
  lon: number
  maxServiceRadiusM: number
  isActive: boolean
}

export type CreateStationPayload = {
  code: string
  name: string
  address: string
  lat: number
  lon: number
  maxServiceRadiusM: number
}

export type UpdateStationPayload = Partial<Omit<AdminStation, 'id'>>
