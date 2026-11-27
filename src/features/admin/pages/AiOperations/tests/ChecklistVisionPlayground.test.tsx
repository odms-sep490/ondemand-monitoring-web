import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from '../../../../../shared/api/httpClient'
import type { PromptVersionView } from '../../../api/promptApi'
import ChecklistVisionPlayground from '../ChecklistVisionPlayground'

vi.mock('../../../../../shared/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../../../../shared/api/httpClient')
  >()),
  apiRequest: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

it('posts the JPEG with the selected draft and renders the returned finding', async () => {
  const versions = [
    { id: 'active', versionNumber: 1, status: 'ACTIVE' },
    { id: 'draft', versionNumber: 2, status: 'DRAFT' },
  ] as PromptVersionView[]
  vi.mocked(apiRequest).mockResolvedValue({
    findings: [{ code: 'PHOTO_1', verdict: 'MATCH', observation: 'Visible', label: 'Roof inspection' }],
  })
  render(<ChecklistVisionPlayground versions={versions} />)
  const image = new File(
    [new Uint8Array([255, 216, 255, 217])],
    'inspection.jpg',
    { type: 'image/jpeg' },
  )
  fireEvent.mouseDown(
    screen.getByRole('combobox', { name: 'Phiên bản prompt' }),
  )
  fireEvent.click(await screen.findByText('v2 · Bản nháp'))
  fireEvent.change(screen.getByLabelText(/Ảnh JPEG/), {
    target: { files: [image] },
  })
  fireEvent.change(screen.getByLabelText(/Tiêu chí kiểm ảnh/), {
    target: { value: 'inspect roof\n inspect wall' },
  })
  fireEvent.mouseDown(
    screen.getByRole('combobox', { name: 'Ngôn ngữ kết quả' }),
  )
  fireEvent.click(await screen.findByText('Tiếng Anh'))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Chạy thử ảnh' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Chạy thử ảnh' }))
  await waitFor(() => expect(apiRequest).toHaveBeenCalledOnce())
  const [path, options] = vi.mocked(apiRequest).mock.calls[0]
  expect(path).toBe('/api/admin/ai-ops/checklist-vision/playground')
  expect(options?.method).toBe('POST')
  expect(Object.fromEntries((options?.body as FormData).entries())).toEqual({
    image,
    promptVersionId: 'draft',
    criteria: '["inspect roof","inspect wall"]',
    language: 'en',
  })
  expect(await screen.findByText('Visible')).toBeTruthy()
  expect(screen.getByText('Roof inspection')).toBeVisible()
  expect(screen.queryByText('inspect roof')).toBeNull()
  expect(screen.getByText('Phù hợp')).toBeInTheDocument()
  expect(screen.getByRole('table')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Chạy thử ảnh' })).toBeEnabled()
  fireEvent.change(screen.getByLabelText(/Tiêu chí kiểm ảnh/), {
    target: { value: 'new criterion' },
  })
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

it('rejects unsupported images without sending a request', async () => {
  render(
    <ChecklistVisionPlayground
      versions={[
        {
          id: 'active',
          versionNumber: 1,
          status: 'ACTIVE',
        } as PromptVersionView,
      ]}
    />,
  )
  fireEvent.change(screen.getByLabelText(/Ảnh JPEG/), {
    target: {
      files: [new File(['png'], 'invalid.png', { type: 'image/png' })],
    },
  })
  expect(
    await screen.findByText('Chọn ảnh JPEG tối đa 2 MiB.'),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Chạy thử ảnh' })).toBeDisabled()
  expect(apiRequest).not.toHaveBeenCalled()
})

it('requires a prompt version before a test can be run', () => {
  render(<ChecklistVisionPlayground versions={[]} />)
  expect(
    screen.getByRole('combobox', { name: 'Phiên bản prompt' }),
  ).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Chạy thử ảnh' })).toBeDisabled()
  expect(apiRequest).not.toHaveBeenCalled()
})

it('validates the criteria limit before calling the API', async () => {
  render(
    <ChecklistVisionPlayground
      versions={[
        {
          id: 'active',
          versionNumber: 1,
          status: 'ACTIVE',
        } as PromptVersionView,
      ]}
    />,
  )
  fireEvent.change(screen.getByLabelText(/Ảnh JPEG/), {
    target: {
      files: [
        new File([new Uint8Array([255, 216, 255])], 'valid.jpg', {
          type: 'image/jpeg',
        }),
      ],
    },
  })
  fireEvent.change(screen.getByLabelText(/Tiêu chí kiểm ảnh/), {
    target: {
      value: Array.from({ length: 17 }, (_, i) => `criterion ${i}`).join('\n'),
    },
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Chạy thử ảnh' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Chạy thử ảnh' }))
  expect(
    await screen.findByText(
      'Nhập tối đa 16 tiêu chí, mỗi tiêu chí tối đa 300 ký tự.',
    ),
  ).toBeInTheDocument()
  expect(apiRequest).not.toHaveBeenCalled()
})

it('localizes provider errors and allows retry after a failed inference', async () => {
  vi.mocked(apiRequest).mockRejectedValue(
    new ApiError('Checklist vision provider rejected the request', {
      code: 'AI_PROVIDER_UNAVAILABLE',
      status: 502,
      method: 'POST',
      path: '/api/admin/ai-ops/checklist-vision/playground',
    }),
  )
  render(
    <ChecklistVisionPlayground
      versions={[
        {
          id: 'active',
          versionNumber: 1,
          status: 'ACTIVE',
        } as PromptVersionView,
      ]}
    />,
  )
  fireEvent.change(screen.getByLabelText(/Ảnh JPEG/), {
    target: {
      files: [
        new File([new Uint8Array([255, 216, 255, 217])], 'image.jpg', {
          type: 'image/jpeg',
        }),
      ],
    },
  })
  fireEvent.change(screen.getByLabelText(/Tiêu chí kiểm ảnh/), {
    target: { value: 'Visible construction' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Chạy thử ảnh' }))
  expect(
    await screen.findByText(
      'Dịch vụ AI chưa thể xử lý ảnh. Vui lòng kiểm tra trạng thái Ollama và thử lại.',
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByText('Checklist vision provider rejected the request'),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Chạy thử ảnh' })).toBeEnabled()
})
