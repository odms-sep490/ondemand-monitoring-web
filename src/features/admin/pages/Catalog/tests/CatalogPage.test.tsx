import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { CatalogPage } from '../CatalogPage'
import { useMockTransport } from './helpers'

useMockTransport()

describe('CatalogPage', () => {
  it('renders the title in both languages', () => {
    render(<CatalogPage />)
    expect(screen.getByText('Danh mục')).toBeTruthy()
    act(() => setLanguage('en'))
    expect(screen.getByText('Catalog')).toBeTruthy()
    act(() => setLanguage('vi'))
  })

  it('shows the sample-data badge only on the stations tab', async () => {
    render(<CatalogPage />)
    await screen.findByText('Giám sát công trình')
    expect(screen.queryByText('Dữ liệu mẫu')).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Trạm' }))
    expect(await screen.findByText('Dữ liệu mẫu')).toBeTruthy()
  })
})
