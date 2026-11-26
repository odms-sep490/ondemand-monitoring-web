import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { checklistImageAiApi } from '../../../api/checklistImageAiApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { ChecklistImageAiSettings } from './ChecklistImageAiSettings'

const initial = {
  enabled: true,
  providerConfigured: true,
  effectiveEnabled: true,
  version: 0,
  updatedAt: '2026-11-26T00:00:00Z',
  updatedBy: 'admin',
}

beforeEach(() => {
  vi.spyOn(checklistImageAiApi, 'get').mockResolvedValue(initial)
  vi.spyOn(checklistImageAiApi, 'update').mockImplementation(
    async (enabled, version) => ({
      ...initial,
      enabled,
      effectiveEnabled: enabled,
      version: version + 1,
    }),
  )
})
afterEach(() => vi.restoreAllMocks())

describe('ChecklistImageAiSettings', () => {
  it('persists both switch directions using the latest server version', async () => {
    render(<ChecklistImageAiSettings />)
    const toggle = await screen.findByRole('switch', {
      name: 'Bật AI đánh giá ảnh toàn hệ thống',
    })
    const save = screen.getByRole('button', { name: 'Lưu cấu hình AI' })
    expect(save).toBeDisabled()
    fireEvent.click(toggle)
    fireEvent.click(save)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Đã lưu cấu hình AI.',
    )
    expect(checklistImageAiApi.update).toHaveBeenLastCalledWith(false, 0)
    expect(toggle).not.toBeChecked()
    fireEvent.click(toggle)
    fireEvent.click(save)
    await waitFor(() =>
      expect(checklistImageAiApi.update).toHaveBeenLastCalledWith(true, 1),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Đã lưu cấu hình AI.',
    )
    expect(toggle).toBeChecked()
  })

  it('requires reload after an update conflict and retains the draft until reload', async () => {
    vi.mocked(checklistImageAiApi.update).mockRejectedValue(
      new ApiError('Conflict', {
        status: 409,
        code: 'CONCURRENT_UPDATE',
        method: 'PUT',
        path: '/api/admin/config/checklist-image-ai',
      }),
    )
    render(<ChecklistImageAiSettings />)
    const toggle = await screen.findByRole('switch')
    fireEvent.click(toggle)
    fireEvent.click(screen.getByRole('button', { name: 'Lưu cấu hình AI' }))
    expect(
      await screen.findByText(
        'Cấu hình đã được cập nhật bởi người khác. Tải lại trước khi lưu.',
      ),
    ).toBeVisible()
    expect(toggle).not.toBeChecked()
    expect(
      screen.getByRole('button', { name: 'Lưu cấu hình AI' }),
    ).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại cấu hình' }))
    await waitFor(() =>
      expect(checklistImageAiApi.get).toHaveBeenCalledTimes(2),
    )
    expect(await screen.findByRole('switch')).toBeChecked()
  })

  it('discloses when the provider is not configured even though the switch is enabled', async () => {
    vi.mocked(checklistImageAiApi.get).mockResolvedValue({
      ...initial,
      providerConfigured: false,
      effectiveEnabled: false,
    })
    render(<ChecklistImageAiSettings />)
    expect(await screen.findByRole('switch')).toBeChecked()
    expect(screen.getByText('Chưa sẵn sàng')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Dịch vụ hoặc model AI chưa được cấu hình.',
    )
  })
})
