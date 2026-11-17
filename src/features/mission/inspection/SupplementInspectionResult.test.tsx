import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../shared/i18n'
import { inspectionCorrectionApi, type SupplementInspectionResult as Result } from './inspectionCorrectionApi'
import { SupplementInspectionResult } from './SupplementInspectionResult'

vi.mock('./CorrectionEvidenceGallery', () => ({
  CorrectionEvidenceGallery: (props: { missionId: string; links: { fileName: string }[]; loadChecklist: (signal: AbortSignal) => Promise<unknown> }) => <div data-testid="gallery" data-mission={props.missionId}>{props.links.map(link => <span key={link.fileName}>{link.fileName}</span>)}<button onClick={() => void props.loadChecklist(new AbortController().signal)}>Refresh preview</button></div>,
}))
afterEach(() => { vi.restoreAllMocks(); setLanguage('vi') })
it('shows accepted child checklist and media with source-scoped preview refresh', async () => {
  setLanguage('vi')
  const response = { missionId: 'child', missionCode: 'MS-12345', completedAt: '2026-11-16T14:00:00Z', executions: [{ id: 'e', content: 'Quay video phía Bắc', assessmentStatus: 'COMPLIANT', assessmentNote: 'Đủ góc quay', evidence: [{ fileName: 'north.mp4', mediaId: 'v', selectedForCustomer: true }] }] } as Result
  const read = vi.spyOn(inspectionCorrectionApi, 'supplementResult').mockResolvedValue(response)
  render(<SupplementInspectionResult missionId="source" correctionId="c" version={4} />)
  expect(await screen.findByText('MS-12345')).toBeInTheDocument()
  expect(screen.getByText('Quay video phía Bắc')).toBeInTheDocument()
  expect(screen.getByText('Đủ góc quay')).toBeInTheDocument()
  expect(screen.getByText('north.mp4')).toBeInTheDocument()
  expect(screen.getByTestId('gallery')).toHaveAttribute('data-mission', 'child')
  fireEvent.click(screen.getByText('Refresh preview'))
  expect(read).toHaveBeenLastCalledWith('source', 'c', expect.any(AbortSignal))
})
it('shows a retryable error instead of hiding failed result loading', async () => {
  setLanguage('en')
  const read = vi.spyOn(inspectionCorrectionApi, 'supplementResult').mockRejectedValueOnce(new Error('denied')).mockResolvedValue({ missionId: 'child', missionCode: 'MS-12345', completedAt: null, executions: [] })
  render(<SupplementInspectionResult missionId="source" correctionId="c" version={1} />)
  expect(await screen.findByText('Unable to load supplemental results. Retry before confirming.')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByRole('button', {name: /Retry/})).not.toBeDisabled())
  fireEvent.click(screen.getByRole('button', {name: /Retry/}))
  expect(await screen.findByText('MS-12345')).toBeInTheDocument()
  expect(read).toHaveBeenCalledTimes(2)
})
