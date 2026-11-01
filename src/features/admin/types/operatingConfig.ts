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
