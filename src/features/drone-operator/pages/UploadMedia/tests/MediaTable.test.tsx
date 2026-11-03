import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

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
  it('keeps recovery available for failed files', () => {
    const retry = vi.fn()
    render(
      <MediaTable
        files={[{ ...files[0], status: 'FAILED', attempt: 1 }]}
        retryingId={null}
        onRetry={retry}
      />,
    )
    expect(screen.getByText('Lần thử: 1/3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(retry).toHaveBeenCalledWith('f1')
  })

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
    expect(screen.getByText('Chưa có tệp để tải lên')).toBeTruthy()
  })

  it('shows indeterminate transfer feedback instead of inventing a percentage', () => {
    render(
      <MediaTable
        files={[
          {
            ...files[0],
            progressPct: 0,
            status: 'UPLOADING',
          },
        ]}
        retryingId={null}
      />,
    )

    expect(
      screen.getByRole('progressbar', { name: 'Đang tải lên' }),
    ).toBeTruthy()
    expect(screen.getByText('Đang tải lên')).toBeTruthy()
    expect(screen.queryByText('50%')).toBeNull()
    expect(screen.queryByText('90%')).toBeNull()
  })

  it('keeps review status separate while showing that the transfer is complete', () => {
    render(
      <MediaTable
        files={[
          {
            ...files[0],
            status: 'PENDING_MANAGER_APPROVAL',
          },
        ]}
        retryingId={null}
      />,
    )

    expect(screen.getByText('Chờ quản lý duyệt')).toBeTruthy()
    expect(screen.getByText('Tải lên hoàn tất')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText('Lần thử')).not.toBeInTheDocument()
  })
})
