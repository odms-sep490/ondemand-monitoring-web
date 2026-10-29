import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { MediaTable } from '../components/MediaTable'
import type { MediaFile } from '../../../types/mission'

const files: MediaFile[] = [
  {
    id: 'f1',
    name: 'photo1.jpg',
    type: 'PHOTO',
    sizeBytes: 2_500_000,
    progressPct: 100,
    attempt: 0,
    maxAttempts: 3,
    status: 'UPLOADED',
  },
]

describe('MediaTable', () => {
  it('renders vietnamese column headers and status label', () => {
    render(<MediaTable files={files} retryingId={null} onRetry={vi.fn()} />)
    expect(screen.getByText('Tên tệp')).toBeTruthy()
    expect(screen.getByText('Đã tải lên')).toBeTruthy()
  })

  it('renders english column headers and status label when language is switched', () => {
    render(<MediaTable files={files} retryingId={null} onRetry={vi.fn()} />)
    act(() => setLanguage('en'))
    expect(screen.getByText('File name')).toBeTruthy()
    expect(screen.getByText('Uploaded')).toBeTruthy()
  })

  it('renders the vietnamese empty state', () => {
    render(<MediaTable files={[]} retryingId={null} onRetry={vi.fn()} />)
    expect(screen.getByText('Chưa có media để tải lên')).toBeTruthy()
  })
})
