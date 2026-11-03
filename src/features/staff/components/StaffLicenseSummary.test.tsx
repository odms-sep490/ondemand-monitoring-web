import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { setLanguage } from '../../../shared/i18n'
import { staffLicenseApi, type StaffLicense } from '../api/staffLicenseApi'
import { StaffLicenseSummary } from './StaffLicenseSummary'

const pilot: StaffLicense = {
  id: 'pilot-1',
  userId: 'staff-1',
  staffName: 'Pilot',
  licenseType: 'PILOT',
  licenseNumber: 'UAV-PILOT-2026-001',
  licenseName: 'UAV Pilot Competency Certificate',
  issuingAuthority: 'ODMS Development Seed Registry — Not valid for aviation operations',
  issuedDate: '2026-01-01',
  expiryDate: '2028-01-01',
  licenseStatus: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  verifiedByName: 'Seed Manager 1',
  verifiedAt: '2026-08-01T09:00:00',
  documentFileName: null,
  notes: null,
  demoRecord: true,
}
const technical: StaffLicense = {
  ...pilot,
  id: 'tech-1',
  licenseType: 'TECHNICAL',
  licenseName: 'Technical Certificate',
}

beforeEach(() => setLanguage('vi'))
afterEach(() => vi.restoreAllMocks())

describe('mission staff license summary', () => {
  it('prefers the license matching the assigned staff role', async () => {
    vi.spyOn(staffLicenseApi, 'list').mockResolvedValue([pilot, technical])
    render(<StaffLicenseSummary userId="staff-1" assignedRole="PILOT" />)

    expect(await screen.findByText('UAV Pilot Competency Certificate')).toBeTruthy()
    expect(screen.getByText(/Đang hoạt động · Đã xác minh/)).toBeTruthy()
    expect(screen.queryByText(/Demo|Dữ liệu demo/)).toBeNull()
    expect(screen.queryByText('Technical Certificate')).toBeNull()
  })

  it('allows a manager to verify pending documentation without changing mission permit state', async () => {
    const verifiable = {
      ...pilot,
      demoRecord: false,
      documentFileName: 'certificate.pdf',
      verificationStatus: 'PENDING' as const,
      verifiedByName: null,
      verifiedAt: null,
    }
    vi.spyOn(staffLicenseApi, 'list').mockResolvedValue([verifiable])
    const verify = vi
      .spyOn(staffLicenseApi, 'verify')
      .mockResolvedValue({ ...verifiable, verificationStatus: 'VERIFIED' })
    render(
      <StaffLicenseSummary userId="staff-1" assignedRole="PILOT" canVerify />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Xác minh' }))
    expect(verify).toHaveBeenCalledWith('pilot-1', 'VERIFIED')
  })
})
