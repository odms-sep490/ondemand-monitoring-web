import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { promptApi, type PromptSummaryView } from '../../../api/promptApi'
import { PromptManagementWorkspace } from '../PromptManagementWorkspace'
import { PromptRuntimeModelDisplay } from '../PromptRuntimeModelDisplay'

vi.mock('../../../api/promptApi', () => ({
  promptApi: {
    listPrompts: vi.fn(),
    listVersions: vi.fn(),
    activationHistory: vi.fn(),
    testRuns: vi.fn(),
    updatePrompt: vi.fn(),
  },
}))

const vision: PromptSummaryView = {
  id: 'vision',
  promptKey: 'checklist.image-vision.system',
  displayName: 'Đánh giá ảnh checklist',
  description: '',
  feature: 'CHECKLIST_IMAGE',
  promptType: 'SYSTEM',
  modelBinding: 'openrouter-vision',
  runtimeModel: {
    provider: 'Ollama',
    model: 'vision-model-a',
    configured: true,
  },
  languages: 'vi',
  variableSchema: [],
  activeVersionId: 'v1',
  activeVersionNumber: 1,
  latestVersionNumber: 1,
  totalVersions: 1,
  enabled: true,
  avgEvalScore: null,
  avgInputTokens: null,
  avgOutputTokens: null,
  avgLatencyMs: null,
  updatedAt: null,
}

afterEach(cleanup)
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(promptApi.listVersions).mockResolvedValue([])
  vi.mocked(promptApi.activationHistory).mockResolvedValue([])
  vi.mocked(promptApi.testRuns).mockResolvedValue([])
})

describe('checklist vision runtime model', () => {
  it('shows changed runtime provider and model rather than stale binding', () => {
    const { rerender } = render(<PromptRuntimeModelDisplay prompt={vision} />)
    expect(screen.getByText('vision-model-a')).toHaveAttribute(
      'title',
      'Nhà cung cấp: Ollama',
    )
    rerender(
      <PromptRuntimeModelDisplay
        prompt={{
          ...vision,
          runtimeModel: {
            provider: 'Another provider',
            model: 'vision-model-b',
            configured: true,
          },
        }}
      />,
    )
    expect(screen.getByText('vision-model-b')).toHaveAttribute(
      'title',
      'Nhà cung cấp: Another provider',
    )
    expect(screen.queryByText(/openrouter-vision/)).toBeNull()
    expect(screen.queryByText(/vision-model-a/)).toBeNull()
  })

  it.each([
    undefined,
    null,
    { provider: ' ', model: '', configured: false },
    { provider: 'Provider', model: 'model', configured: false },
  ])(
    'reports unavailable configuration without metadata fallback: %j',
    (runtimeModel) => {
      render(<PromptRuntimeModelDisplay prompt={{ ...vision, runtimeModel }} />)
      expect(screen.getByTitle(/Cấu hình chưa sẵn sàng/)).toBeTruthy()
      expect(screen.queryByText(/openrouter-vision/)).toBeNull()
    },
  )

  it('retains the binding for other prompts without claiming runtime information', () => {
    render(
      <PromptRuntimeModelDisplay
        prompt={{ ...vision, promptKey: 'other.system' }}
      />,
    )
    expect(screen.getByText('openrouter-vision')).toBeTruthy()
    expect(screen.queryByText(/Nhà cung cấp/)).toBeNull()
  })

  it('uses runtime in list, header and readonly metadata and preserves the saved binding', async () => {
    vi.mocked(promptApi.listPrompts).mockResolvedValue([vision])
    vi.mocked(promptApi.updatePrompt).mockResolvedValue(vision)
    render(<PromptManagementWorkspace />)
    await waitFor(() =>
      expect(screen.getAllByText('vision-model-a')).toHaveLength(2),
    )
    expect(screen.getByText('v1 · Đang dùng')).toBeTruthy()
    expect(screen.queryByText(/openrouter-vision/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Sửa thông tin/ }))
    const modal = within(await screen.findByRole('dialog'))
    expect(modal.getByText('vision-model-a')).toBeTruthy()
    expect(modal.getByText(/được quản lý bằng cấu hình hệ thống/)).toBeTruthy()
    expect(modal.queryByLabelText('Model liên kết')).toBeNull()
    fireEvent.click(modal.getByRole('button', { name: 'Lưu thông tin' }))
    await waitFor(() =>
      expect(promptApi.updatePrompt).toHaveBeenCalledWith(
        vision.promptKey,
        expect.objectContaining({ modelBinding: 'openrouter-vision' }),
      ),
    )
  })

  it('keeps metadata binding editable for other prompts', async () => {
    vi.mocked(promptApi.listPrompts).mockResolvedValue([
      { ...vision, promptKey: 'other.system' },
    ])
    render(<PromptManagementWorkspace />)
    fireEvent.click(
      await screen.findByRole('button', { name: /Sửa thông tin/ }),
    )
    const modal = within(await screen.findByRole('dialog'))
    const input = modal.getByLabelText('Model liên kết')
    fireEvent.change(input, { target: { value: 'new-binding' } })
    fireEvent.click(modal.getByRole('button', { name: 'Lưu thông tin' }))
    await waitFor(() =>
      expect(promptApi.updatePrompt).toHaveBeenCalledWith(
        'other.system',
        expect.objectContaining({ modelBinding: 'new-binding' }),
      ),
    )
  })
})
