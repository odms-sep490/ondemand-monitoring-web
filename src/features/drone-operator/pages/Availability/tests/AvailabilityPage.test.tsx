import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { AvailabilityPage } from '../AvailabilityPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('AvailabilityScreen', () => {
  it('renders vietnamese text once availability loads', async () => {
    render(<AvailabilityPage />)
    expect(await screen.findByText('Lưu thay đổi')).toBeTruthy()
    expect(screen.getByText('Rảnh')).toBeTruthy()
  })

  it('renders english text when language is switched', async () => {
    render(<AvailabilityPage />)
    await screen.findByText('Lưu thay đổi')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Save changes')).toBeTruthy()
    expect(screen.getByText('Available')).toBeTruthy()
  })
})
