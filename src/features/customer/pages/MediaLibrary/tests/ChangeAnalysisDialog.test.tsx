import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChangeAnalysisDialog } from '../ChangeAnalysisDialog'

vi.mock('../../../../../shared/api/httpClient', () => ({ apiRequest: vi.fn(async () => []) }))

describe('ChangeAnalysisDialog', () => {
  it('requires two images and rejects unsupported uploads', async () => {
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:preview', revokeObjectURL: vi.fn() })
    try {
      render(<ChangeAnalysisDialog onClose={() => {}} />)
      const submit = screen.getByRole('button', { name: 'Phân tích bằng AI' })
      expect(submit).toBeDisabled()
      fireEvent.change(screen.getByLabelText('Ảnh trước từ máy'), {
        target: { files: [new File(['first'], 'first.txt', { type: 'text/plain' })] },
      })
      expect(screen.getByAltText('Ảnh trước')).toHaveAttribute('src', 'blob:preview')
      fireEvent.change(screen.getByLabelText('Ảnh sau từ máy'), {
        target: { files: [new File(['second'], 'second.png', { type: 'image/png' })] },
      })
      fireEvent.click(submit)
      expect(await screen.findByText(/Ảnh không hợp lệ/)).toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
