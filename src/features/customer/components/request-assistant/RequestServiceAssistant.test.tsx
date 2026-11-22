import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from '../../../../shared/api/httpClient'
import { RequestServiceAssistant } from './RequestServiceAssistant'
import type { ComponentProps } from 'react'

// JSDOM cannot finish Ant Design's CSS animations; keep the real dialog and
// controls while disabling only its opening/closing transitions in these tests.
vi.mock('antd', async importOriginal => {
  const actual = await importOriginal<typeof import('antd')>()
  return { ...actual, Modal: (props: ComponentProps<typeof actual.Modal>) =>
    <actual.Modal {...props} transitionName="" maskTransitionName="" /> }
})

vi.mock('../../../../shared/api/httpClient', async importOriginal => ({
  ...await importOriginal<typeof import('../../../../shared/api/httpClient')>(),
  apiRequest: vi.fn(),
}))
afterEach(() => vi.resetAllMocks())

const selection = { serviceId: 'old-service', items: [{ sourceChecklistId: 'old-item', requestedImageCount: 4, requestedVideoCount: 0 }] }

it('identifies a deleted service and returns to service selection instead of retrying the stale request', async () => {
  vi.mocked(apiRequest).mockRejectedValue(new ApiError('Service not found', {
    code: 'SERVICE_NOT_FOUND', status: 404, method: 'POST', path: '/api/customer/request-assistant/messages',
  }))
  const reselect = vi.fn()
  render(<RequestServiceAssistant selection={selection} onSelectionInvalid={reselect} />)
  fireEvent.click(screen.getByRole('button', { name: /Hỏi AI về dịch vụ/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Vì sao có chi phí này?' }))
  const recover = await screen.findByRole('button', { name: 'Chọn lại dịch vụ' })
  await waitFor(() => expect(screen.getByText(/Dịch vụ đang chọn đã thay đổi/)).toBeVisible())
  expect(screen.queryByText(/Chưa kết nối được AI/)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Gửi câu hỏi' })).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument()
  fireEvent.click(recover)
  expect(reselect).toHaveBeenCalledOnce()
  expect(apiRequest).toHaveBeenCalledTimes(1)
})

it('keeps retry available for a real connection failure and renders the recovered answer without bold markers', async () => {
  vi.mocked(apiRequest).mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValueOnce({ status: 'READY', answer: '**Chi phí** là tạm tính.' })
  render(<RequestServiceAssistant selection={selection} />)
  fireEvent.click(screen.getByRole('button', { name: /Hỏi AI về dịch vụ/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Vì sao có chi phí này?' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }))
  await waitFor(() => expect(screen.getByText('Chi phí là tạm tính.')).toBeVisible())
  expect(apiRequest).toHaveBeenCalledTimes(2)
})
