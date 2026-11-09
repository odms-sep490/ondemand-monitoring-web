import { apiRequest } from '../../../shared/api/httpClient'

export type StaffLicenseType = 'PILOT' | 'TECHNICAL' | 'OTHER'
export type StaffLicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED'
export type StaffLicenseVerification = 'PENDING' | 'VERIFIED' | 'REJECTED'

export type StaffLicense = {
  id: string
  userId: string
  staffName: string
  licenseType: StaffLicenseType
  licenseNumber: string
  licenseName: string
  issuingAuthority: string
  issuedDate: string
  expiryDate: string | null
  licenseStatus: StaffLicenseStatus
  verificationStatus: StaffLicenseVerification
  verifiedByName: string | null
  verifiedAt: string | null
  documentFileName: string | null
  notes: string | null
  demoRecord: boolean
}

export type StaffLicenseInput = {
  userId: string
  licenseType: StaffLicenseType
  licenseNumber: string
  licenseName: string
  issuingAuthority: string
  issuedDate: string
  expiryDate: string | null
  licenseStatus: Exclude<StaffLicenseStatus, 'REVOKED'>
  notes: string | null
}

export type StaffLicenseDocument = {
  url: string
  expiresInSeconds: number
  fileName: string
}

export const staffLicenseApi = {
  list: (userId: string, signal?: AbortSignal) =>
    apiRequest<StaffLicense[]>(
      `/api/staff-licenses/users/${encodeURIComponent(userId)}`,
      { signal },
    ),
  create: (input: StaffLicenseInput) =>
    apiRequest<StaffLicense>('/api/staff-licenses', {
      method: 'POST',
      body: input,
    }),
  update: (id: string, input: StaffLicenseInput) =>
    apiRequest<StaffLicense>(`/api/staff-licenses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: input,
    }),
  upload: (id: string, file: File) => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest<StaffLicense>(
      `/api/staff-licenses/${encodeURIComponent(id)}/document`,
      { method: 'POST', body },
    )
  },
  document: (id: string) =>
    apiRequest<StaffLicenseDocument>(
      `/api/staff-licenses/${encodeURIComponent(id)}/document`,
    ),
  verify: (
    id: string,
    status: Exclude<StaffLicenseVerification, 'PENDING'>,
    notes?: string,
  ) =>
    apiRequest<StaffLicense>(
      `/api/staff-licenses/${encodeURIComponent(id)}/verification`,
      {
        method: 'POST',
        body: { status, notes },
      },
    ),
  revoke: (id: string, notes?: string) =>
    apiRequest<StaffLicense>(
      `/api/staff-licenses/${encodeURIComponent(id)}/revoke`,
      {
        method: 'POST',
        query: { notes },
      },
    ),
}
