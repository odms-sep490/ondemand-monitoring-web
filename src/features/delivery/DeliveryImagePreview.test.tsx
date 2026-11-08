import * as http from '../../shared/api/httpClient'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { setLanguage } from '../../shared/i18n'
import { DeliveryImagePreview } from './DeliveryImagePreview'

afterEach(() => {
  setLanguage('vi')
  vi.restoreAllMocks()
})

it('opens a zoomable image and closes it without reopening through portal clicks', async () => {
  setLanguage('en')
  render(
    <DeliveryImagePreview
      src="https://example.test/roof.jpg"
      fileName="roof.jpg"
    />,
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Enlarge image roof.jpg' }),
  )
  const dialog = await screen.findByRole('dialog')
  expect(dialog).toBeInTheDocument()
  expect(
    document.querySelector('.ant-image-preview-operations-operation-zoomIn'),
  ).not.toBeNull()
  fireEvent.click(document.querySelector('.ant-image-preview-close')!)
  // jsdom does not finish Ant Design's CSS animation; leaving means visibility is false.
  await waitFor(() => expect(dialog).toHaveClass('ant-zoom-leave'))
  expect(dialog).not.toHaveClass('ant-zoom-enter')
})

it('recovers a failed zoom image once and then provides a retry action', async () => {
  setLanguage('en')
  const request = vi
    .spyOn(http, 'apiRequest')
    .mockResolvedValue({
      viewUrl: 'https://example.test/original',
      fileSize: 100,
    })
  render(
    <DeliveryImagePreview
      src="https://example.test/thumb"
      previewSrc="https://example.test/preview"
      mediaId="media"
      fileName="roof.jpg"
    />,
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Enlarge image roof.jpg' }),
  )
  await screen.findByRole('dialog')
  fireEvent.error(document.querySelector('.ant-image-preview-img')!)
  await waitFor(() =>
    expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
      'src',
      'https://example.test/original',
    ),
  )
  fireEvent.error(document.querySelector('.ant-image-preview-img')!)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to display',
  )
  expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled()
  expect(request).toHaveBeenCalledTimes(1)
})
