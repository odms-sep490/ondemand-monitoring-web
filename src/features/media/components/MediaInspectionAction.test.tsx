import { afterEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as http from '../../../shared/api/httpClient'
import { setLanguage } from '../../../shared/i18n'
import { MediaInspectionAction } from './MediaInspectionAction'
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})
const props = {
  missionId: 'mission',
  mediaId: 'media',
  mediaType: 'IMAGE',
  fileName: 'photo.jpg',
}
it('requests an original only after an explicit action with exact Nhiệm vụ and media scope', async () => {
  setLanguage('en')
  const api = vi
    .spyOn(http, 'apiRequest')
    .mockResolvedValue({ mediaId: 'media', viewUrl: '/original.jpg' })
  render(<MediaInspectionAction {...props} />)
  expect(api).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Inspect original' }))
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      '/api/operator/missions/mission/media/media/original-view',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      }),
    ),
  )
  await waitFor(() =>
    expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
      'src',
      '/original.jpg',
    ),
  )
})
it('opens a local video without registering, uploading, or calling BE', async () => {
  setLanguage('en')
  const api = vi.spyOn(http, 'apiRequest')
  render(
    <MediaInspectionAction
      {...props}
      mediaType="VIDEO"
      localUrl="http://localhost:8090/local.mp4"
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'View local file' }))
  await waitFor(() =>
    expect(document.querySelector('video')).toHaveAttribute(
      'src',
      'http://localhost:8090/local.mp4',
    ),
  )
  expect(api).not.toHaveBeenCalled()
})
it('does not display raw errors or originals from another media', async () => {
  setLanguage('en')
  vi.spyOn(http, 'apiRequest').mockResolvedValue({
    mediaId: 'sibling',
    viewUrl: '/sibling.jpg',
  })
  render(<MediaInspectionAction {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Inspect original' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to open the file',
  )
  expect(document.querySelector('.ant-image-preview-img')).toBeNull()
  expect(screen.queryByText('Invalid media scope')).toBeNull()
})
it('clears the previous source when switching Nhiệm vụ', async () => {
  setLanguage('en')
  vi.spyOn(http, 'apiRequest').mockResolvedValue({
    mediaId: 'media',
    viewUrl: '/original.jpg',
  })
  const view = render(<MediaInspectionAction {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Inspect original' }))
  await waitFor(() => {
    const image = document.querySelector('.ant-image-preview-img')
    expect(image).not.toBeNull()
    return image!
  })
  view.rerender(<MediaInspectionAction {...props} missionId="sibling" />)
  await waitFor(() =>
    expect(document.querySelector('.ant-image-preview-img')).toBeNull(),
  )
})

it('requires an explicit action to use a remote original after a local failure', async () => {
  setLanguage('en')
  const api = vi
    .spyOn(http, 'apiRequest')
    .mockResolvedValue({ mediaId: 'media', viewUrl: '/remote-original.jpg' })
  render(
    <MediaInspectionAction
      {...props}
      localUrl="http://localhost:8090/photo.jpg"
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'View local file' }))
  fireEvent.error(
    await waitFor(() => {
      const image = document.querySelector('.ant-image-preview-img')
      expect(image).not.toBeNull()
      return image!
    }),
  )
  expect(api).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Inspect original' }))
  await waitFor(() =>
    expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
      'src',
      '/remote-original.jpg',
    ),
  )
  expect(api).toHaveBeenCalledTimes(1)
})

it('switches viewer labels without closing the file or modifying its name', async () => {
  setLanguage('en')
  const props = {
    missionId: 'mission',
    mediaId: 'media',
    mediaType: 'IMAGE',
    fileName: 'Ảnh gốc.png',
    localUrl: '/local.png',
  }
  render(<MediaInspectionAction {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'View local file' }))
  await waitFor(() =>
    expect(document.querySelector('.ant-image-preview-img')).not.toBeNull(),
  )
  act(() => setLanguage('vi'))
  expect(
    screen.getByRole('button', { name: 'Xem tệp trên thiết bị' }),
  ).toBeInTheDocument()
  expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
    'src',
    '/local.png',
  )
  expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
    'src',
    '/local.png',
  )
  expect(screen.queryByText('View local file')).toBeNull()
})

it('opens images directly in the lightbox without the old dialog or an extra request', async () => {
  setLanguage('en')
  const api = vi.spyOn(http, 'apiRequest')
  render(
    <MediaInspectionAction
      {...props}
      localUrl="/local-photo.jpg"
      appearance="cockpit"
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'View local file' }))
  await waitFor(() =>
    expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
      'src',
      '/local-photo.jpg',
    ),
  )
  expect(
    document.querySelector('.media-inspection-dialog'),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Enlarge' }),
  ).not.toBeInTheDocument()
  expect(api).not.toHaveBeenCalled()
  fireEvent.click(document.querySelector('.ant-image-preview-close')!)
  await waitFor(() =>
    expect(
      document.querySelector('.ant-image-preview-img'),
    ).not.toBeInTheDocument(),
  )
})

it('disables remote inspection until upload validation is ready', () => {
  setLanguage('en')
  const api = vi.spyOn(http, 'apiRequest')
  render(<MediaInspectionAction {...props} originalReady={false} />)
  const button = screen.getByRole('button', { name: 'Inspect original' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute(
    'title',
    expect.stringContaining('validation must succeed'),
  )
  fireEvent.click(button)
  expect(api).not.toHaveBeenCalled()
})
it('keeps local video available before validation without offering an unready remote original', async () => {
  setLanguage('en')
  const api = vi.spyOn(http, 'apiRequest')
  render(
    <MediaInspectionAction
      {...props}
      mediaType="VIDEO"
      localUrl="/local.mp4"
      originalReady={false}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'View local file' }))
  await waitFor(() =>
    expect(document.querySelector('video')).toHaveAttribute(
      'src',
      '/local.mp4',
    ),
  )
  fireEvent.error(document.querySelector('video')!)
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Inspect original' })).toBeNull()
  expect(screen.getByText(/validation must succeed first/)).toBeInTheDocument()
  expect(api).not.toHaveBeenCalled()
})

it('keeps one image lightbox while the original URL is pending and after it resolves', async () => {
  setLanguage('en')
  let resolve!: (value: { mediaId: string; viewUrl: string }) => void
  vi.spyOn(http, 'apiRequest').mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }) as never,
  )
  render(<MediaInspectionAction {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Inspect original' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Opening file')
  const lightbox = document.querySelector('.ant-image-preview-wrap')
  expect(lightbox).not.toBeNull()
  expect(document.querySelector('.media-inspection-dialog')).toBeNull()
  await act(async () => resolve({ mediaId: 'media', viewUrl: '/original.jpg' }))
  await waitFor(() =>
    expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
      'src',
      '/original.jpg',
    ),
  )
  expect(document.querySelector('.ant-image-preview-wrap')).toBe(lightbox)
  fireEvent.error(document.querySelector('.ant-image-preview-img')!)
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to open')
  expect(document.querySelector('.ant-image-preview-wrap')).toBe(lightbox)
  expect(document.querySelector('.media-inspection-dialog')).toBeNull()
})
it('closing the loading lightbox prevents a late response from reopening it', async () => {
  setLanguage('en')
  let resolve!: (value: { mediaId: string; viewUrl: string }) => void
  vi.spyOn(http, 'apiRequest').mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }) as never,
  )
  render(<MediaInspectionAction {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Inspect original' }))
  await screen.findByRole('status')
  fireEvent.click(document.querySelector('.ant-image-preview-close')!)
  await act(async () => resolve({ mediaId: 'media', viewUrl: '/late.jpg' }))
  expect(document.querySelector('.ant-image-preview-wrap')).toBeNull()
  expect(document.querySelector('.media-inspection-dialog')).toBeNull()
})
