import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../api/httpClient'
import { setLanguage } from '../../i18n'
import { ResilientMedia } from './MediaRecovery'
vi.mock('../../api/httpClient', () => ({ apiRequest: vi.fn() }))
const api = vi.mocked(apiRequest)
beforeEach(() => {
  setLanguage('en')
  api.mockReset()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  setLanguage('vi')
})
const props = {
  kind: 'image' as const,
  src: 'https://example.test/preview',
  mediaId: 'media',
  fileName: 'photo.jpg',
}

describe('media error recovery', () => {
  it('keeps the poster probe out of delivery card layout', () => {
    const { container } = render(
      <article className="delivery-asset">
        <ResilientMedia
          {...props}
          kind="video"
          poster="https://example.test/poster.jpg"
        />
      </article>,
    )
    expect(container.querySelectorAll('video')).toHaveLength(1)
    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(screen.getByLabelText('photo.jpg')).toHaveAttribute(
      'poster',
      'https://example.test/poster.jpg',
    )
  })

  it('keeps non-seekable video usable when no poster exists', () => {
    render(<ResilientMedia {...props} kind="video" />)
    const player = screen.getByLabelText('photo.jpg')
    Object.defineProperty(player, 'duration', { configurable: true, value: 10 })
    Object.defineProperty(player, 'currentTime', {
      configurable: true,
      set: () => {
        throw new Error('not seekable')
      },
    })
    expect(() => fireEvent.loadedMetadata(player)).not.toThrow()
    expect(screen.getByRole('button', { name: 'Expand video' })).toBeEnabled()
  })

  it('hides the native download action and opens a larger video player', async () => {
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => {})
    render(<ResilientMedia {...props} kind="video" />)
    expect(screen.getByLabelText('photo.jpg')).toHaveAttribute(
      'controlslist',
      'nodownload',
    )
    expect(screen.getByLabelText('photo.jpg')).toHaveAttribute(
      'preload',
      'metadata',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Expand video' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      screen
        .getAllByLabelText('photo.jpg')
        .filter((node) => node.tagName === 'VIDEO'),
    ).toHaveLength(2)
    expect(pause).toHaveBeenCalledTimes(1)
  })
  it('uses a placeholder until a video without a poster has a displayable frame', () => {
    const { container } = render(<ResilientMedia {...props} kind="video" />)
    expect(container.querySelector('.media-video__placeholder')).not.toBeNull()
    const player = screen.getByLabelText('photo.jpg')
    Object.defineProperty(player, 'duration', { configurable: true, value: 10 })
    fireEvent.loadedMetadata(player)
    expect((player as HTMLVideoElement).currentTime).toBe(0.01)
    fireEvent.loadedData(player)
    expect(container.querySelector('.media-video__placeholder')).toBeNull()
  })
  it('shows the placeholder when the generated poster fails to load', () => {
    const probes: HTMLImageElement[] = []
    vi.stubGlobal('Image', function PosterProbe() {
      const image = document.createElement('img')
      probes.push(image)
      return image
    })
    const { container } = render(
      <ResilientMedia
        {...props}
        kind="video"
        poster="https://example.test/missing-poster"
      />,
    )
    expect(screen.getByLabelText('photo.jpg')).toHaveAttribute(
      'preload',
      'none',
    )
    fireEvent.error(probes[0])
    expect(screen.getByLabelText('photo.jpg')).toHaveAttribute(
      'preload',
      'metadata',
    )
    expect(screen.getByLabelText('photo.jpg')).not.toHaveAttribute('poster')
    expect(container.querySelector('.media-video__placeholder')).not.toBeNull()
  })

  it('does not time out an image that has already loaded', async () => {
    vi.useFakeTimers()
    render(<ResilientMedia {...props} />)
    fireEvent.load(screen.getByRole('img'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(api).not.toHaveBeenCalled()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('stops a hanging fallback request after the API timeout', async () => {
    vi.useFakeTimers()
    api.mockImplementation(
      (_path, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () =>
            reject(new Error('aborted')),
          )
        }) as ReturnType<typeof apiRequest>,
    )
    render(<ResilientMedia {...props} />)
    fireEvent.error(screen.getByRole('img'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to display')
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('times out a stalled displayed image and attempts one fallback', async () => {
    vi.useFakeTimers()
    api.mockResolvedValue({
      viewUrl: 'https://example.test/recovered',
      fileSize: 100,
    })
    render(<ResilientMedia {...props} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })
    expect(api).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.test/recovered',
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to display')
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('refreshes once, stops if the original fails, and allows a manual retry', async () => {
    api.mockResolvedValue({
      viewUrl: 'https://example.test/original',
      fileSize: 100,
    })
    render(<ResilientMedia {...props} />)
    fireEvent.error(screen.getByRole('img'))
    await waitFor(() =>
      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        'https://example.test/original',
      ),
    )
    fireEvent.error(screen.getByRole('img'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to display',
    )
    expect(api).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(api).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('img')).toHaveAttribute(
      'src',
      'https://example.test/original',
    )
  })
  it('shows a retry action when the fallback API fails', async () => {
    api.mockRejectedValue(new Error('Network unavailable'))
    render(<ResilientMedia {...props} />)
    fireEvent.error(screen.getByRole('img'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to display',
    )
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled()
  })
  it('does not load a large original until explicitly requested', async () => {
    render(<ResilientMedia {...props} original fileSize={30 * 1024 * 1024} />)
    expect(screen.queryByRole('img')).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: 'Load original to view' }),
    )
    expect(await screen.findByRole('img')).toBeInTheDocument()
  })
  it('asks before loading a large original returned by recovery', async () => {
    api.mockResolvedValue({
      viewUrl: 'https://example.test/large-original',
      fileSize: 30 * 1024 * 1024,
    })
    render(<ResilientMedia {...props} />)
    fireEvent.error(screen.getByRole('img'))
    expect(
      await screen.findByRole('button', { name: 'Load original to view' }),
    ).toBeEnabled()
    expect(screen.queryByRole('img')).toBeNull()
  })
  it('ignores a late response after switching media', async () => {
    let resolve!: (value: unknown) => void
    api.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        }) as ReturnType<typeof apiRequest>,
    )
    const { rerender } = render(<ResilientMedia {...props} />)
    fireEvent.error(screen.getByRole('img'))
    rerender(
      <ResilientMedia
        {...props}
        mediaId="other"
        src="https://example.test/other"
      />,
    )
    await act(async () =>
      resolve({ viewUrl: 'https://example.test/stale', fileSize: 100 }),
    )
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.test/other',
    )
  })
  it('handles unsupported video without repeating automatic requests', async () => {
    api.mockResolvedValue({
      viewUrl: 'https://example.test/original-video',
      fileSize: 100,
    })
    render(<ResilientMedia {...props} kind="video" />)
    fireEvent.error(screen.getByLabelText('photo.jpg'))
    await waitFor(() =>
      expect(screen.getByLabelText('photo.jpg')).toHaveAttribute(
        'src',
        'https://example.test/original-video',
      ),
    )
    fireEvent.error(screen.getByLabelText('photo.jpg'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'format may not be supported',
    )
    expect(api).toHaveBeenCalledTimes(1)
  })
})
