import type { UserRole } from '../../auth/types'

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING'

export type AdminAccountItem = {
  id: string
  fullName: string
  email: string
  role: UserRole
  status: AccountStatus
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
}

export type AdminAccountDetail = AdminAccountItem & {
  linkedProviders: string[]
  avatarUrl: string | null
}
