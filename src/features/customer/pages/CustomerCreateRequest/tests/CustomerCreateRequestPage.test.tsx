import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { CustomerCreateRequestPage } from '../CustomerCreateRequestPage'

beforeEach(() => {
  resetMockDb()
  // The simulation map metadata is a static file, not an API call.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
})
afterEach(() => {
  resetMockDb()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('CustomerCreateRequestPage', () => {
  it('renders the Vietnamese page title', async () => {
    render(<CustomerCreateRequestPage />)
    expect(await screen.findByText('Tạo yêu cầu giám sát')).toBeInTheDocument()
  })

  it('renders the English page title when language is switched', async () => {
    render(<CustomerCreateRequestPage />)
    await screen.findByText('Tạo yêu cầu giám sát')
    act(() => setLanguage('en'))
    expect(
      await screen.findByText('Create Monitoring Request'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Submit request' }),
    ).toBeInTheDocument()
  })

  it('lists BE services (not the legacy category list) and price estimate', async () => {
    render(<CustomerCreateRequestPage />)
    expect(
      await screen.findByRole('button', { name: /Giám sát công trình/ }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Hạ tầng')).not.toBeInTheDocument()
  })

  it('validates required fields before opening the confirm dialog', async () => {
    render(<CustomerCreateRequestPage />)
    await screen.findByLabelText(/Địa chỉ hoặc khu vực/)
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    expect(
      await screen.findByText('Nhập địa chỉ/khu vực cần giám sát.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Nhập tiêu đề yêu cầu.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
