import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../shared/api/httpClient'
import { setLanguage } from '../../../../shared/i18n'
import { financeApi } from '../../api'
import type { PricingChecklistItem } from '../../types'
import { ChecklistGuidanceEditor } from '../components/ChecklistGuidanceEditor'

const item: PricingChecklistItem = {
  id: 'custom',
  content: 'Inspect roof',
  sourceChecklistId: null,
  sourceType: 'CUSTOMER_CUSTOM',
  displayOrder: 1,
  reviewStatus: 'INCLUDED',
  managerNote: null,
  managerQuoteRequired: false,
  managerQuotedPrice: null,
  checklistRevision: 2,
  guidanceVersion: 3,
  canEditGuidance: true,
}
const complete = {
  ...item,
  executionSteps: ['Capture roof'],
  inputRequirements: ['Clear weather'],
  expectedOutputs: ['Roof images'],
}
const props = {
  orderId: 'order',
  item,
  checklistRevision: 2,
  invalidatesQuote: true,
  onSaved: vi.fn(),
  onClose: vi.fn(),
}
afterEach(() => vi.restoreAllMocks())

describe('ChecklistGuidanceEditor', () => {
  it('saves incomplete drafts with normalized empty lists and independent version tokens', async () => {
    const save = vi
      .spyOn(financeApi, 'saveChecklistGuidance')
      .mockResolvedValue(item)
    render(<ChecklistGuidanceEditor {...props} />)
    fireEvent.change(screen.getByLabelText('Mô tả bổ sung (tùy chọn)'), {
      target: { value: '  Roof scope  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('order', 'custom', {
        expectedChecklistRevision: 2,
        expectedGuidanceVersion: 3,
        description: 'Roof scope',
        executionSteps: [],
        inputRequirements: [],
        expectedOutputs: [],
        confirm: false,
      }),
    )
  })
  it('requires all three sections for confirmation and allows a complete confirmation', async () => {
    const save = vi
      .spyOn(financeApi, 'saveChecklistGuidance')
      .mockResolvedValue(item)
    render(<ChecklistGuidanceEditor {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hướng dẫn' }))
    expect(
      await screen.findAllByText('Nhập ít nhất một dòng trước khi xác nhận.'),
    ).toHaveLength(3)
    expect(save).not.toHaveBeenCalled()
    for (const label of [
      'Các bước thực hiện',
      'Đầu vào cần có',
      'Đầu ra cần nộp',
    ])
      fireEvent.change(screen.getByLabelText(`${label} 1`), {
        target: { value: `  ${label}  ` },
      })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hướng dẫn' }))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'order',
        'custom',
        expect.objectContaining({
          confirm: true,
          executionSteps: ['Các bước thực hiện'],
        }),
      ),
    )
  })
  it('preserves typed text and captured versions across refresh and 409; explicitly reloads before retry', async () => {
    const save = vi
      .spyOn(financeApi, 'saveChecklistGuidance')
      .mockRejectedValueOnce(
        new ApiError('stale', {
          status: 409,
          code: 'STALE_GUIDANCE_VERSION',
          method: 'PUT',
          path: '/',
        }),
      )
      .mockResolvedValue(item)
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
      orderId: 'order',
      orderCode: null,
      customerName: '',
      serviceName: '',
      basePackagePrice: 0,
      checklistRevision: 2,
      checklistItems: [{ ...complete, guidanceVersion: 9 }],
      currentQuote: null,
      quoteHistory: [],
    })
    const view = render(<ChecklistGuidanceEditor {...props} item={complete} />)
    fireEvent.change(screen.getByLabelText('Các bước thực hiện 1'), {
      target: { value: 'My preserved steps' },
    })
    view.rerender(
      <ChecklistGuidanceEditor
        {...props}
        item={{
          ...complete,
          guidanceVersion: 8,
          executionSteps: ['Background refresh'],
        }}
      />,
    )
    expect(screen.getByLabelText('Các bước thực hiện 1')).toHaveValue(
      'My preserved steps',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hướng dẫn' }))
    const reload = await screen.findByRole('button', {
      name: 'Tải lại dữ liệu mới nhất',
    })
    expect(screen.getByRole('button', { name: 'Lưu nháp' })).toBeDisabled()
    expect(screen.getByLabelText('Các bước thực hiện 1')).toHaveValue(
      'My preserved steps',
    )
    expect(save).toHaveBeenCalledWith(
      'order',
      'custom',
      expect.objectContaining({ expectedGuidanceVersion: 3 }),
    )
    fireEvent.click(reload)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Lưu nháp' })).toBeEnabled(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))
    await waitFor(() =>
      expect(save).toHaveBeenLastCalledWith(
        'order',
        'custom',
        expect.objectContaining({
          expectedGuidanceVersion: 9,
          executionSteps: ['My preserved steps'],
        }),
      ),
    )
  })
  it('keeps field errors beside inputs and preserves text after validation rejection', async () => {
    vi.spyOn(financeApi, 'saveChecklistGuidance').mockRejectedValue(
      new ApiError('Invalid input', {
        status: 400,
        errors: { 'executionSteps[0]': 'Step rejected' },
        method: 'PUT',
        path: '/',
      }),
    )
    render(<ChecklistGuidanceEditor {...props} item={complete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))
    expect(await screen.findByText('Step rejected')).toBeInTheDocument()
    expect(screen.getByLabelText('Các bước thực hiện 1')).toHaveValue(
      'Capture roof',
    )
  })
  it('blocks further saves after the backend locks guidance', async () => {
    vi.spyOn(financeApi, 'saveChecklistGuidance').mockRejectedValue(
      new ApiError('Locked', {
        status: 409,
        code: 'CHECKLIST_GUIDANCE_EDIT_BLOCKED',
        method: 'PUT',
        path: '/',
      }),
    )
    render(<ChecklistGuidanceEditor {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Lưu nháp' })).toBeDisabled(),
    )
    expect(
      screen.queryByRole('button', { name: 'Tải lại dữ liệu mới nhất' }),
    ).toBeNull()
  })
  it('supports reorder and removal, trims duplicate rows, and warns before invalidating quotes', async () => {
    const save = vi
      .spyOn(financeApi, 'saveChecklistGuidance')
      .mockResolvedValue(item)
    render(
      <ChecklistGuidanceEditor
        {...props}
        item={{ ...complete, executionSteps: ['First', ' Second ', 'First'] }}
      />,
    )
    expect(
      screen.getByText(/Thay đổi hướng dẫn sẽ làm báo giá/),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Di chuyển lên Các bước thực hiện 2',
      }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Xóa dòng Các bước thực hiện 3' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hướng dẫn' }))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'order',
        'custom',
        expect.objectContaining({ executionSteps: ['Second', 'First'] }),
      ),
    )
  })
  it('asks before discarding dirty text, keeps it on cancel, and supports English labels', async () => {
    act(() => setLanguage('en'))
    const onClose = vi.fn()
    render(<ChecklistGuidanceEditor {...props} onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('Execution steps 1'), {
      target: { value: 'Keep me' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    const confirmation = (
      await screen.findByText('Discard unsaved changes?')
    ).closest('[role=dialog]') as HTMLElement
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'Keep editing' }),
    )
    expect(screen.getByLabelText('Execution steps 1')).toHaveValue('Keep me')
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(
      await screen.findByRole('button', { name: 'Discard changes' }),
    )
    expect(onClose).toHaveBeenCalledOnce()
  })
  it('does not save when edit permission is absent', () => {
    const save = vi.spyOn(financeApi, 'saveChecklistGuidance')
    render(
      <ChecklistGuidanceEditor
        {...props}
        item={{ ...item, canEditGuidance: false }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Lưu nháp' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Xác nhận hướng dẫn' }),
    ).toBeDisabled()
    expect(save).not.toHaveBeenCalled()
  })
})
