import { apiRequest } from '../../../shared/api/httpClient'
import type { UserRole, AuthProvider } from '../../auth/types'

export type CurrentUserProfile = {
  id: string
  email: string
  fullName: string
  role: UserRole
  linkedProviders: AuthProvider[]
  avatarUrl?: string
  phoneNumber?: string
  emailVerified?: boolean
  active?: boolean
  createdAt?: string
  lastLoginAt?: string
  customerProfile?: {
    phoneNumber?: string
    address?: string
    companyName?: string
    citizenIdentificationNumber?: string
    companyTaxCode?: string
  }
}

export type UserProfileUpdateRequest = {
  fullName?: string
  phoneNumber?: string
  address?: string
  companyName?: string
  citizenIdentificationNumber?: string
  companyTaxCode?: string
}

export function canSetLocalPassword(profile?: CurrentUserProfile): boolean {
  return Boolean(
    profile?.linkedProviders?.includes('GOOGLE') &&
    !profile.linkedProviders.includes('LOCAL'),
  )
}

export const userProfileApi = {
  getCurrent: (signal?: AbortSignal) =>
    apiRequest<CurrentUserProfile>('/api/users/me', { signal }),
  update: (body: UserProfileUpdateRequest) =>
    apiRequest<CurrentUserProfile>('/api/users/me', { method: 'PATCH', body }),
}
