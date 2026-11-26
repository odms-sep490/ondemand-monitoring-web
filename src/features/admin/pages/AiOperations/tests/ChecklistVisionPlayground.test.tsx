import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { apiRequest } from '../../../../../shared/api/httpClient'
import type { PromptVersionView } from '../../../api/promptApi'
import ChecklistVisionPlayground from '../ChecklistVisionPlayground'

vi.mock('../../../../../shared/api/httpClient', () => ({ apiRequest: vi.fn() }))

it('posts the JPEG with the selected draft and renders the returned finding', async () => {
  const versions = [
    { id: 'active', versionNumber: 1, status: 'ACTIVE' },
    { id: 'draft', versionNumber: 2, status: 'DRAFT' },
  ] as PromptVersionView[]
  vi.mocked(apiRequest).mockResolvedValue({ findings: [{ code: 'PHOTO_1', verdict: 'PASS', observation: 'Visible' }] })
  render(<ChecklistVisionPlayground versions={versions} />)
  const image = new File([new Uint8Array([255, 216, 255, 217])], 'inspection.jpg', { type: 'image/jpeg' })
  fireEvent.change(screen.getByLabelText(/Phiên bản prompt/), { target: { value: 'draft' } })
  fireEvent.change(screen.getByLabelText(/Ảnh JPEG/), { target: { files: [image] } })
  fireEvent.change(screen.getByLabelText(/Tiêu chí kiểm ảnh/), { target: { value: 'inspect roof\n inspect wall' } })
  fireEvent.change(screen.getByLabelText(/Ngôn ngữ/), { target: { value: 'en' } })
  fireEvent.click(screen.getByRole('button', { name: 'Chạy thử ảnh' }))
  await waitFor(() => expect(apiRequest).toHaveBeenCalledOnce())
  const [path, options] = vi.mocked(apiRequest).mock.calls[0]
  expect(path).toBe('/api/admin/ai-ops/checklist-vision/playground')
  expect(options?.method).toBe('POST')
  expect(Object.fromEntries((options?.body as FormData).entries())).toEqual({
    image, promptVersionId: 'draft', criteria: '["inspect roof","inspect wall"]', language: 'en',
  })
  expect(await screen.findByText('Visible')).toBeTruthy()
})
