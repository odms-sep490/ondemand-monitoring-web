import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { MaintenanceTicketDialog } from '../components/MaintenanceTicketDialog'

describe('MaintenanceTicketDialog', () => {
  it('renders vietnamese title and buttons', () => {
    render(
      <MaintenanceTicketDialog
        droneCode="DRN-01"
        missionId="MSN-1"
        defaultIssueType="OTHER"
        defaultDescription=""
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText('Tạo yêu cầu bảo trì')).toBeTruthy()
    expect(screen.getByText('Tạo yêu cầu hỗ trợ')).toBeTruthy()
  })

  it('renders english title and buttons when language is switched', () => {
    render(
      <MaintenanceTicketDialog
        droneCode="DRN-01"
        missionId="MSN-1"
        defaultIssueType="OTHER"
        defaultDescription=""
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Create maintenance ticket')).toBeTruthy()
    expect(screen.getByText('Create ticket')).toBeTruthy()
  })
})
