import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SummaryBanner } from '../components/SummaryBanner'

describe('multi-drone preflight action', () => {
  it('shows the next-drone action instead of handover for an individually passed drone', () => {
    const next = vi.fn()
    render(<SummaryBanner nOk={11} nTotal={11} progress={100} isReady isFailed={false}
      failedItems={[]} error={null} hasTriggered triggering={false} onTrigger={vi.fn()}
      onReady={next} readyActionLabel="Kiểm tra drone tiếp theo" missionId="mission-1"
      replacementRequesting={false} replacementRequested={false} replacementRequestError={null}
      onRequestDroneReplacement={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra drone tiếp theo' }))
    expect(next).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: /Tiếp tục tới bàn giao/ })).toBeNull()
  })
})
