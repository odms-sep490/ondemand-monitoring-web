import type { ReactNode } from 'react'
import type { OrderIconName } from './OrderIcon'

export type DetailItem = {
  label: ReactNode
  value: ReactNode
  icon?: OrderIconName
  tone?: 'green' | 'blue' | 'orange' | 'purple'
}
