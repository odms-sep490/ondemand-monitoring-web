import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { UploadMediaPage } from '../UploadMediaPage'

describe('UploadMediaScreen', () => {
  it('renders vietnamese chrome text', () => {
    render(<UploadMediaPage />)
    expect(screen.queryByText('Quay lại buồng lái')).toBeNull()
    expect(screen.getAllByText('Làm mới')[0]).toBeTruthy()
  })

  it('renders english chrome text when language is switched', () => {
    render(<UploadMediaPage />)
    act(() => setLanguage('en'))
    expect(screen.queryByText('Back to cockpit')).toBeNull()
    expect(screen.getAllByText('Refresh')[0]).toBeTruthy()
  })
})
