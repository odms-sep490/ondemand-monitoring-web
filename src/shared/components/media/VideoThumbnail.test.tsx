import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../api/httpClient'
import { setLanguage } from '../../i18n'
import { VideoThumbnail } from './VideoThumbnail'
import { ResilientMedia } from './MediaRecovery'
vi.mock('../../api/httpClient', () => ({ apiRequest: vi.fn() }))
const api = vi.mocked(apiRequest)
beforeEach(() => {
  setLanguage('en')
  api.mockReset()
})
afterEach(() => {
  vi.useRealTimers()
  setLanguage('vi')
})
const props = {
  src: 'https://example.test/preview.mp4',
  poster: 'https://example.test/poster.jpg',
  mediaId: 'm',
  fileName: 'clip.mp4',
}
describe('video thumbnails', () => {
  it('renders only the poster in the card until opened', () => {
    const { container } = render(<VideoThumbnail {...props} />)
    expect(container.querySelector('img')).toHaveAttribute('src', props.poster)
    expect(container.querySelector('video')).toBeNull()
    expect(api).not.toHaveBeenCalled()
  })
  it('keeps the poster in the card when video playback fails in the viewer', async () => {
    api.mockRejectedValue(new Error('unavailable'))
    const { container } = render(<VideoThumbnail {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'View video clip.mp4' }))
    await screen.findByRole('dialog')
    fireEvent.error(screen.getByLabelText('clip.mp4', { selector: 'video' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to display',
    )
    expect(container.querySelector('img')).toHaveAttribute('src', props.poster)
    expect(
      screen.getByRole('button', { name: 'View video clip.mp4' }),
    ).toBeEnabled()
  })
  it('uses a placeholder when the poster fails, without loading a video', () => {
    const { container, rerender } = render(<VideoThumbnail {...props} />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('video')).toBeNull()
    rerender(
      <VideoThumbnail {...props} poster="https://example.test/new.jpg" />,
    )
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.test/new.jpg',
    )
  })
  it('does not time out an idle video whose poster is already available', async () => {
    vi.useFakeTimers()
    render(<ResilientMedia {...props} kind="video" expanded />)
    const player = screen.getByLabelText('clip.mp4', { selector: 'video' })
    fireEvent.loadStart(player)
    fireEvent.stalled(player)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(api).not.toHaveBeenCalled()
  })
})
