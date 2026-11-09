import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setLanguage } from '../../../shared/i18n'
import { staffLicenseApi, type StaffLicense } from '../api/staffLicenseApi'
import { StaffLicensesSection } from './StaffLicensesSection'

const license: StaffLicense = {
  id: 'license-1',
  userId: 'staff-1',
  staffName: 'Seed Staff 1',
  licenseType: 'PILOT',
  licenseNumber: 'UAV-PILOT-2026-001',
  licenseName: 'UAV Pilot Competency Certificate',
  issuingAuthority: 'ODMS Development Seed Registry — Not valid for aviation operations',
  issuedDate: '2026-01-15',
  expiryDate: '2029-01-15',
  licenseStatus: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  verifiedByName: 'Seed Manager 1',
  verifiedAt: '2026-08-01T09:00:00',
  documentFileName: null,
  notes: 'Dữ liệu demo, không phải chứng chỉ thật.',
  demoRecord: true,
}

beforeEach(() => setLanguage('vi'))
afterEach(() => vi.restoreAllMocks())

describe('staff UAV licenses profile section', () => {
  it('renders API license details and truthful attachment and verification states', async () => {
    vi.spyOn(staffLicenseApi, 'list').mockResolvedValue([license])
    render(<StaffLicensesSection userId="staff-1" />)

    expect(await screen.findByText(/UAV-PILOT-2026-001/)).toBeTruthy()
    expect(screen.getByText('UAV Pilot Competency Certificate')).toBeTruthy()
    expect(screen.getByText('ODMS Development Seed Registry — Not valid for aviation operations')).toBeTruthy()
    expect(screen.getByText('15/01/2026')).toBeTruthy()
    expect(screen.getByText('15/01/2029')).toBeTruthy()
    expect(screen.getByText('Đã xác minh')).toBeTruthy()
    expect(screen.getByText('Đang hoạt động')).toBeTruthy()
    expect(screen.getByText('Chưa có tài liệu đính kèm')).toBeTruthy()
    expect(screen.queryByText(/Dữ liệu demo|Dữ liệu minh họa/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Xem chứng chỉ' })).toBeNull()
  })

  it('offers certificate viewing only when the API returns an attachment', async () => {
    vi.spyOn(staffLicenseApi, 'list').mockResolvedValue([
      { ...license, documentFileName: 'pilot-certificate.pdf' },
    ])
    render(<StaffLicensesSection userId="staff-1" />)

    expect(await screen.findByText('pilot-certificate.pdf')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Xem chứng chỉ' })).toBeTruthy()
  })

  it('opens the entry form only on request and creates a new license', async () => {
    vi.spyOn(staffLicenseApi, 'list').mockResolvedValue([])
    const create = vi
      .spyOn(staffLicenseApi, 'create')
      .mockResolvedValue(license)
    const upload = vi
      .spyOn(staffLicenseApi, 'upload')
      .mockResolvedValue(license)
    render(<StaffLicensesSection userId="staff-1" />)
    await screen.findByText('Chưa có bằng lái hoặc chứng chỉ nào.')
    expect(screen.queryByLabelText('Số giấy tờ')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Thêm giấy tờ' }))
    fireEvent.change(screen.getByLabelText('Số giấy tờ'), {
      target: { value: 'PILOT-NEW' },
    })
    fireEvent.change(screen.getByLabelText('Tên bằng / chứng chỉ'), {
      target: { value: 'Bằng lái thử' },
    })
    fireEvent.change(screen.getByLabelText('Cơ quan cấp'), {
      target: { value: 'Trung tâm thử nghiệm' },
    })
    fireEvent.change(screen.getByLabelText('Ngày cấp'), {
      target: { value: '2026-01-01' },
    })
    fireEvent.change(screen.getByLabelText('Ngày hết hạn (nếu có)'), {
      target: { value: '2028-01-01' },
    })
    const file = new File(['%PDF-1.7 test'], 'pilot.pdf', {
      type: 'application/pdf',
    })
    fireEvent.change(
      screen.getByLabelText('Tệp giấy tờ (PDF, JPG, PNG · tối đa 10 MB)'),
      {
        target: { files: [file] },
      },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Lưu giấy tờ' }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'staff-1',
          licenseNumber: 'PILOT-NEW',
          licenseType: 'PILOT',
        }),
      ),
    )
    expect(upload).toHaveBeenCalledWith('license-1', file)
    expect(await screen.findByText('Đã lưu thông tin giấy tờ.')).toBeTruthy()
  })

  it('rejects an expiry date earlier than the issue date before sending', async () => {
    vi.spyOn(staffLicenseApi, 'list').mockResolvedValue([])
    const create = vi.spyOn(staffLicenseApi, 'create')
    render(<StaffLicensesSection userId="staff-1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Thêm giấy tờ' }))
    fireEvent.change(screen.getByLabelText('Số giấy tờ'), {
      target: { value: 'PILOT-NEW' },
    })
    fireEvent.change(screen.getByLabelText('Tên bằng / chứng chỉ'), {
      target: { value: 'Bằng lái thử' },
    })
    fireEvent.change(screen.getByLabelText('Cơ quan cấp'), {
      target: { value: 'Trung tâm thử nghiệm' },
    })
    fireEvent.change(screen.getByLabelText('Ngày cấp'), {
      target: { value: '2026-01-10' },
    })
    fireEvent.change(screen.getByLabelText('Ngày hết hạn (nếu có)'), {
      target: { value: '2026-01-09' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu giấy tờ' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ngày hết hạn không được trước ngày cấp.',
    )
    expect(create).not.toHaveBeenCalled()
  })
})
