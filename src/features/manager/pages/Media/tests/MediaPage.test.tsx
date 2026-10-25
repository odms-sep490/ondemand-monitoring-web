import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { MediaPage } from '../MediaPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('MediaPage', () => {
  it('renders the page title', () => {
    render(<MediaPage />)
    expect(screen.getByText('Media và giao kết quả')).toBeTruthy()
  })

  it('shows loading skeleton initially', () => {
    const { container } = render(<MediaPage />)
    const skeleton = container.querySelector('.odm-sk')
    expect(skeleton).toBeTruthy()
  })

  it('shows data tabs after loading', async () => {
    render(<MediaPage />)
    await waitFor(() => {
      expect(screen.getByText('Manual upload')).toBeTruthy()
    })
    expect(screen.getByText('Media lỗi validate')).toBeTruthy()
    expect(screen.getByText('Chờ giao kết quả')).toBeTruthy()
  })

  it('shows manual upload task rows after loading', async () => {
    render(<MediaPage />)
    await waitFor(() => {
      expect(screen.getByText('DJI_0284.MP4')).toBeTruthy()
    })
  })

  it('shows the English page title and tabs when language is switched', async () => {
    render(<MediaPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Media & delivery')).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByText('Failed validation')).toBeTruthy()
    })
    expect(screen.getByText('Awaiting delivery')).toBeTruthy()
  })
})
