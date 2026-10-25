import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { ReportsPage } from '../ReportsPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('ReportsPage', () => {
  it('renders the page title', () => {
    render(<ReportsPage />)
    expect(screen.getByText('Báo cáo vận hành')).toBeTruthy()
  })

  it('shows loading skeletons initially', () => {
    const { container } = render(<ReportsPage />)
    const skeletons = container.querySelectorAll('.odm-sk')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows KPI values from design after loading [TK MNG-12]', async () => {
    render(<ReportsPage />)
    await waitFor(() => {
      expect(screen.getByText('96')).toBeTruthy()
    })
    expect(screen.getByText('91%')).toBeTruthy()
  })

  it('shows "Xuất CSV" button', async () => {
    render(<ReportsPage />)
    await waitFor(() => {
      expect(screen.getByText('Xuất CSV')).toBeTruthy()
    })
  })

  it('shows section headings', async () => {
    render(<ReportsPage />)
    await waitFor(() => {
      expect(
        screen.getByText('Tỉ lệ mission thành công theo tuần'),
      ).toBeTruthy()
    })
    expect(screen.getByText('Phân bổ đơn theo dịch vụ')).toBeTruthy()
    expect(screen.getByText('Utilization từng drone')).toBeTruthy()
    expect(screen.getByText('Top lý do thất bại')).toBeTruthy()
  })

  it('renders English headings after switching language', async () => {
    render(<ReportsPage />)
    await waitFor(() => {
      expect(screen.getByText('Xuất CSV')).toBeTruthy()
    })

    act(() => setLanguage('en'))

    expect(screen.getByText('Operations reports')).toBeTruthy()
    expect(screen.getByText('Export CSV')).toBeTruthy()
    expect(screen.getByText('Mission success rate by week')).toBeTruthy()
  })
})
