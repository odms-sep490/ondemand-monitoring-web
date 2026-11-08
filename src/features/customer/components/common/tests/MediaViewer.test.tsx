import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import type { MediaItem } from '../../../lib/media/types'
import { MediaViewer } from '../media'

const base: MediaItem = {
  id: 'm1',
  missionId: 'ms1',
  deviceId: null,
  kind: 'image',
  fileName: 'a.jpg',
  contentType: 'image/jpeg',
  fileSize: 10,
  capturedAt: null,
  availableAt: null,
  url: 'https://x/a.jpg',
  previewUrl: 'https://x/preview.jpg',
}

afterEach(() => act(() => setLanguage('vi')))

describe('MediaViewer', () => {
  it('renders the authorized original viewing fallback after derivative failure', () => {
    render(<MediaViewer item={{ ...base, url: null, previewUrl: 'https://x/original-view', derivativeStatus: 'FAILED' }} />)
    expect(screen.getByRole('img', { name: 'a.jpg' })).toHaveAttribute('src', 'https://x/original-view')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders an image, a video player, or a fallback per kind', () => {
    const { rerender } = render(<MediaViewer item={base} />)
    expect(screen.getByRole('img', { name: 'a.jpg' })).toHaveAttribute('src', 'https://x/preview.jpg')
    rerender(<MediaViewer item={{ ...base, kind: 'video', fileName: 'v.mp4' }} />)
    expect(screen.getByLabelText('v.mp4').tagName).toBe('VIDEO')
    rerender(<MediaViewer item={{ ...base, kind: 'other' }} />)
    expect(screen.getByText(/Không thể xem trước/)).toBeInTheDocument()
  })

  it('explains a missing or expired URL in both languages', () => {
    render(<MediaViewer item={{ ...base, previewUrl: null }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Đường dẫn xem đã hết hạn')
    act(() => setLanguage('en'))
    expect(screen.getByRole('status')).toHaveTextContent('viewing link has expired')
  })
})
