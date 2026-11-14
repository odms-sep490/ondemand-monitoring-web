import { afterEach, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { setLanguage } from '../../../../../shared/i18n'
import { QueueStatusPanel } from './QueueStatusPanel'

afterEach(() => setLanguage('vi'))
it('shows the precise capture-age reason and translates it without changing the job', () => {
  const retry = vi.fn()
  render(
    <QueueStatusPanel
      jobs={[
        {
          id: 'job',
          stage: 'FAILED',
          errorCode: 'MEDIA_CAPTURE_TOO_OLD',
          payload: {
            candidate: { fileName: 'drone.jpg', contentType: 'image/jpeg' },
          },
        },
      ]}
      retry={retry}
      remove={vi.fn()}
      backup={vi.fn()}
      onRefresh={vi.fn()}
    />,
  )
  expect(
    screen.getByText(/Thời điểm chụp\/quay đã vượt giới hạn/),
  ).toBeInTheDocument()
  act(() => setLanguage('en'))
  expect(
    screen.getByText(/capture time exceeds the allowed age/),
  ).toBeInTheDocument()
  expect(screen.getByText('drone.jpg')).toBeInTheDocument()
  expect(screen.queryByText('MEDIA_CAPTURE_TOO_OLD')).toBeNull()
  expect(retry).not.toHaveBeenCalled()
})
