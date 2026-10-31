export type OperatingPolicy = {
  id: string
  key: string
  value: string
  unit: string
  description: string
  effectiveFrom: string
  effectiveTo: string | null
}

export type DispatchWeight = {
  key: string
  label: string
  value: number
  group: 'DRONE' | 'OPERATOR'
}

export type ZoneType = 'AIRPORT' | 'MILITARY' | 'RESTRICTED' | 'TEMPORARY'

export type NoFlyZone = {
  id: string
  name: string
  source: string
  zoneType: ZoneType
  lat: number
  lon: number
  radiusM: number
  maxAltitudeM: number | null
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
}

export type UpdatePolicyPayload = {
  value: string
}

export type UpdateWeightsPayload = {
  group: 'DRONE' | 'OPERATOR'
  weights: Array<{ key: string; value: number }>
}

export type OrderExpirationSettings = {
  quotationAcceptanceTimeoutHours: number
  depositPaymentTimeoutHours: number
  updatedBy: string
  updatedAt: string | null
}

export type OrderExpirationSettingAudit = {
  id: string
  settingName: 'quotationAcceptanceTimeoutHours' | 'depositPaymentTimeoutHours'
  previousValue: number
  newValue: number
  actor: string
  changedAt: string
}

export type UpdateOrderExpirationSettingsPayload = Pick<
  OrderExpirationSettings,
  'quotationAcceptanceTimeoutHours' | 'depositPaymentTimeoutHours'
>

export type CreateNoFlyZonePayload = Omit<NoFlyZone, 'id'>
export type UpdateNoFlyZonePayload = Partial<Omit<NoFlyZone, 'id'>>
