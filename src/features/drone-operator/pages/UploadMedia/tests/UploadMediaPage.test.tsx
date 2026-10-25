import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { UploadMediaPage } from '../UploadMediaPage'

describe('UploadMediaScreen', () => {
  it('renders vietnamese chrome text', () => {
    render(<UploadMediaPage />)
    expect(screen.getByText('Quay lại buồng lái')).toBeTruthy()
    expect(screen.getByText('Làm mới')).toBeTruthy()
  })

  it('renders english chrome text when language is switched', () => {
    render(<UploadMediaPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Back to cockpit')).toBeTruthy()
    expect(screen.getByText('Refresh')).toBeTruthy()
  })
})
