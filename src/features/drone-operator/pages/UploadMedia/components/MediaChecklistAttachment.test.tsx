import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MissionChecklistExecution } from '../../../../mission/types/checklistExecution'
import { MediaChecklistAttachment } from './MediaChecklistAttachment'

const rows = [
  {
    id: 'a',
    content: 'Ghi nhận toàn cảnh khu vực',
    description: 'Chụp từ trên cao',
    eligibleEvidenceCount: 0,
    minimumEvidenceCount: 2,
  },
  {
    id: 'b',
    content: 'Kiểm tra mái công trình',
    eligibleEvidenceCount: 1,
    minimumEvidenceCount: 1,
  },
] as MissionChecklistExecution[]

afterEach(() => vi.restoreAllMocks())

describe('Media checklist attachment picker', () => {
  it('keeps selections across search and attaches once using the explicit selection', async () => {
    const save = vi.fn().mockResolvedValue(true)
    render(
      <MediaChecklistAttachment
        fileName="inspection.jpg"
        mediaId="media"
        executions={rows}
        selectedIds={[]}
        disabled={false}
        onSave={save}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gắn vào checklist' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(
      within(dialog).getByRole('checkbox', { name: /Ghi nhận toàn cảnh/ }),
    )
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'mái' },
    })
    fireEvent.click(
      within(dialog).getByRole('checkbox', { name: /Kiểm tra mái/ }),
    )
    expect(save).not.toHaveBeenCalled()
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Gắn vào 2 mục' }),
    )
    await waitFor(() =>
      expect(save).toHaveBeenCalledExactlyOnceWith(['a', 'b']),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Đã gắn bằng chứng vào checklist.',
    )
  })

  it('cancels without applying changes to the parent selection', async () => {
    const save = vi.fn()
    render(
      <MediaChecklistAttachment
        fileName="inspection.jpg"
        executions={rows}
        selectedIds={['a']}
        disabled={false}
        onSave={save}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Chọn mục checklist' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(
      within(dialog).getByRole('checkbox', { name: /Kiểm tra mái/ }),
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }))
    expect(save).not.toHaveBeenCalled()
  })

  it('preserves failed selections for retry and never lets this picker detach existing evidence', async () => {
    const save = vi.fn().mockResolvedValue(false)
    render(
      <MediaChecklistAttachment
        fileName="inspection.jpg"
        mediaId="media"
        executions={[
          {
            ...rows[0],
            evidence: [
              { mediaId: 'media' },
            ] as MissionChecklistExecution['evidence'],
          },
          rows[1],
        ]}
        selectedIds={[]}
        disabled={false}
        onSave={save}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Chọn mục checklist' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByRole('checkbox', { name: /Ghi nhận toàn cảnh/ }),
    ).toBeDisabled()
    fireEvent.click(
      within(dialog).getByRole('checkbox', { name: /Kiểm tra mái/ }),
    )
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Gắn vào 1 mục' }),
    )
    expect(
      await within(dialog).findByText(
        'Chưa gắn được bằng chứng. Lựa chọn của bạn được giữ lại; hãy thử lại.',
      ),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole('checkbox', { name: /Kiểm tra mái/ }),
    ).toBeChecked()
    expect(save).toHaveBeenCalledWith(['b'])
  })
  it('excludes incompatible evidence types from select visible', async () => {
    const save = vi.fn().mockResolvedValue(true)
    render(
      <MediaChecklistAttachment
        fileName="photo.jpg"
        mediaId="m"
        mediaType="IMAGE"
        executions={[
          { ...rows[0], requiredEvidenceType: 'IMAGE' },
          { ...rows[1], requiredEvidenceType: 'VIDEO' },
        ]}
        selectedIds={[]}
        disabled={false}
        onSave={save}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gắn vào checklist' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByRole('checkbox', { name: /Kiểm tra mái/ }),
    ).toBeDisabled()
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Chọn các mục đang hiển thị',
      }),
    )
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Gắn vào 1 mục' }),
    )
    await waitFor(() => expect(save).toHaveBeenCalledExactlyOnceWith(['a']))
  })
  it('requires confirmation and removes only the selected attachment', async () => {
    const detach = vi.fn().mockResolvedValue(undefined)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(
      <MediaChecklistAttachment
        fileName="photo.jpg"
        mediaId="m"
        executions={[
          {
            ...rows[0],
            evidence: [
              { mediaId: 'm' },
            ] as MissionChecklistExecution['evidence'],
          },
        ]}
        selectedIds={[]}
        disabled={false}
        onSave={vi.fn()}
        onDetach={detach}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gỡ khỏi mục này' }))
    expect(detach).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Gỡ khỏi mục này' }))
    await waitFor(() => expect(detach).toHaveBeenCalledExactlyOnceWith('a'))
  })
})
