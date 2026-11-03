import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { setLanguage } from '../../shared/i18n'
import { DeliveryImagePreview } from './DeliveryImagePreview'

afterEach(() => setLanguage('vi'))

it('opens a zoomable image and closes it without reopening through portal clicks', async () => {
  setLanguage('en')
  render(<DeliveryImagePreview src="https://example.test/roof.jpg" fileName="roof.jpg" />)
  fireEvent.click(screen.getByRole('button', { name: 'Enlarge image roof.jpg' }))
  const dialog = await screen.findByRole('dialog')
  expect(dialog).toBeInTheDocument()
  expect(document.querySelector('.ant-image-preview-operations-operation-zoomIn')).not.toBeNull()
  fireEvent.click(document.querySelector('.ant-image-preview-close')!)
  // jsdom does not finish Ant Design's CSS animation; leaving means visibility is false.
  await waitFor(() => expect(dialog).toHaveClass('ant-zoom-leave'))
  expect(dialog).not.toHaveClass('ant-zoom-enter')
})
