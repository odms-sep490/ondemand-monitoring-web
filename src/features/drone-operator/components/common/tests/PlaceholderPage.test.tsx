import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { PlaceholderPage } from '../PlaceholderPage'

describe('PlaceholderPage', () => {
  it('renders the vietnamese in-development text', () => {
    render(<PlaceholderPage title="Zone map" />)
    expect(screen.getByText('Đang phát triển')).toBeTruthy()
  })

  it('renders the english text when language is switched', () => {
    render(<PlaceholderPage title="Zone map" />)
    act(() => setLanguage('en'))
    expect(screen.getByText('In development')).toBeTruthy()
  })
})
