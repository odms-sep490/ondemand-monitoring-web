import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getLanguage, setLanguage } from '../i18n/languageStore'
import { LanguageToggle } from './LanguageToggle'

describe('LanguageToggle', () => {
  beforeEach(() => setLanguage('vi'))
  afterEach(() => {
    setLanguage('vi')
  })

  it('shows VI pressed by default', () => {
    render(<LanguageToggle />)
    expect(screen.getByRole('button', { name: 'Tiếng Việt' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('clicking EN updates aria-pressed and the language store', () => {
    render(<LanguageToggle />)
    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(getLanguage()).toBe('en')
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Tiếng Việt' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('uses a bilingual group aria-label', () => {
    render(<LanguageToggle />)
    expect(screen.getByRole('group', { name: 'Ngôn ngữ' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
  })
})
