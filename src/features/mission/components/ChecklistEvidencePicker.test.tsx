import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { EvidenceCandidate } from '../types/checklistExecution'
import { ChecklistEvidencePicker } from './ChecklistEvidencePicker'

const candidate = (id: string): EvidenceCandidate => ({
  mediaId: id,
  fileName: `${id}.jpg`,
  mediaType: 'IMAGE',
  contentType: 'image/jpeg',
  status: 'PENDING_MANAGER_APPROVAL',
  sourceType: 'DRONE_CAMERA',
  capturedAt: '',
  validatedAt: null,
  attachable: true,
  eligibleForOperationalReadiness: false,
  eligibleForFinalApproval: false,
  ineligibilityReason: null,
  previewUrl: null,
  urlExpiresAt: null,
  alreadyAttachedExecutionIds: [],
})
describe('multi-select evidence picker', () => {
  it('retains selections across pages and adds all files with one confirmation', async () => {
    const first = Array.from({ length: 50 }, (_, index) =>
      candidate(`first-${index}`),
    )
    const next = candidate('second')
    const onSelect = vi.fn().mockResolvedValue(undefined)
    render(
      <ChecklistEvidencePicker
        missionId="m"
        open
        onClose={vi.fn()}
        onSelect={onSelect}
        loadCandidates={async (page) => (page ? [next] : first)}
      />,
    )
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'first-0.jpg' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    fireEvent.click(await screen.findByRole('checkbox', { name: 'second.jpg' }))
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Gắn 2 file' }))
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith([first[0], next]))
  }, 15000)
  it('prevents wrong media type and keeps selection after an attach failure', async () => {
    const image = candidate('image')
    const video = {
      ...candidate('video'),
      fileName: 'video.mp4',
      mediaType: 'VIDEO',
    }
    render(
      <ChecklistEvidencePicker
        missionId="m"
        open
        requiredType="IMAGE"
        onClose={vi.fn()}
        onSelect={vi.fn().mockRejectedValue(new Error('conflict'))}
        loadCandidates={async () => [image, video]}
      />,
    )
    expect(
      await screen.findByRole('checkbox', { name: 'video.mp4' }),
    ).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: 'image.jpg' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gắn 1 file' }))
    await screen.findByRole('alert')
    expect(screen.getByRole('checkbox', { name: 'image.jpg' })).toBeChecked()
  })
})
