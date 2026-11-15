import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../shared/i18n'
import { ChecklistEvidencePanel } from './ChecklistEvidencePanel'
import {
  MonitoringChecklistSection,
  monitoringErrorMessage,
} from './MonitoringChecklistSection'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import { ApiError } from '../../../shared/api/httpClient'
import type {
  MissionChecklistExecution,
  MissionChecklistEvidence,
  EvidenceCandidate,
} from '../types/checklistExecution'
import { checklistEvidencePanelMessages as messages } from './ChecklistEvidencePanel.messages'
import { monitoringChecklistMessages as monitor } from './MonitoringChecklistSection.messages'

const link = {
  evidenceId: 'link',
  mediaId: 'media',
  executionId: 'item',
  fileName: 'Ảnh gốc của khách.jpg',
  mediaType: 'IMAGE',
  sourceType: 'UNKNOWN_FUTURE_SOURCE',
  capturedAt: '2026-11-13T00:00:00Z',
  mediaStatus: 'VALIDATING',
  eligibleForOperationalReadiness: false,
  ineligibilityReason: 'MEDIA_NOT_VALIDATED',
} as MissionChecklistEvidence
const item = {
  id: 'item',
  content: 'Nội dung khách hàng nhập',
  displayOrder: 1,
  sourceType: 'CUSTOMER_CUSTOM',
  executionStatus: 'PENDING',
  assessmentStatus: 'NOT_ASSESSED',
  version: 1,
  minimumEvidenceCount: 2,
  eligibleEvidenceCount: 0,
  evidence: [link],
  blockingReasons: ['INSUFFICIENT_EVIDENCE'],
  createdAt: '2026-11-13T00:00:00Z',
} as MissionChecklistExecution
const props = {
  missionId: 'mission',
  item,
  canAttach: true,
  canDetach: true,
  refresh: vi.fn(),
}
afterEach(() => {
  setLanguage('vi')
  vi.restoreAllMocks()
})

it('switches compact evidence labels/reasons in place and preserves original file names and user content', () => {
  setLanguage('en')
  render(<ChecklistEvidencePanel {...props} compact />)
  expect(screen.getByText('Evidence')).toBeInTheDocument()
  expect(screen.getByText('Not validated')).toBeInTheDocument()
  expect(screen.getByText(/Unknown source/)).toBeInTheDocument()
  expect(screen.getByText(link.fileName)).toBeInTheDocument()
  expect(screen.queryByText('UNKNOWN_FUTURE_SOURCE')).toBeNull()
  act(() => setLanguage('vi'))
  expect(screen.getByText('Bằng chứng')).toBeInTheDocument()
  expect(screen.getByText('Chưa xác thực')).toBeInTheDocument()
  expect(screen.getByText(link.fileName)).toBeInTheDocument()
  act(() => setLanguage('en'))
  expect(screen.getByText('Not validated')).toBeInTheDocument()
  expect(screen.queryByText('Chưa xác thực')).toBeNull()
})

it('keeps the evidence picker and typed search open while translating all controls', async () => {
  setLanguage('en')
  const candidate = {
    ...link,
    mediaId: 'different-media',
    status: 'VALIDATING',
    attachable: false,
    alreadyAttachedExecutionIds: [],
  } as unknown as EvidenceCandidate
  vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([candidate])
  const attach = vi.spyOn(checklistEvidenceApi, 'attach')
  render(<ChecklistEvidencePanel {...props} />)
  fireEvent.click(
    screen.getByRole('button', { name: 'Add evidence from mission media' }),
  )
  const search = await screen.findByRole('searchbox', { name: 'Search media' })
  fireEvent.change(search, { target: { value: 'Ảnh gốc' } })
  await screen.findByRole('button', { name: 'Attach media' })
  act(() => setLanguage('vi'))
  expect(
    screen.getByRole('searchbox', { name: messages.vi.searchLabel }),
  ).toHaveValue('Ảnh gốc')
  expect(
    screen.getByRole('dialog', { name: messages.vi.pick }),
  ).toBeInTheDocument()
  act(() => setLanguage('en'))
  expect(screen.getByRole('searchbox', { name: 'Search media' })).toHaveValue(
    'Ảnh gốc',
  )
  expect(screen.getByRole('button', { name: 'Attach media' })).toBeDisabled()
  expect(attach).not.toHaveBeenCalled()
})

it('translates a visible server blocker/error rather than leaking diagnostics or freezing the old language', () => {
  const error = new ApiError('INTERNAL_DIAGNOSTIC', {
    code: 'CONCURRENT_UPDATE',
    method: 'PATCH',
    path: '/test',
    status: 409,
  })
  setLanguage('vi')
  render(
    <MonitoringChecklistSection
      missionId="mission"
      loading={false}
      error={error}
      refresh={vi.fn()}
    />,
  )
  expect(screen.getByText(monitor.vi.concurrentUpdate)).toBeInTheDocument()
  act(() => setLanguage('en'))
  expect(screen.getByText(monitor.en.concurrentUpdate)).toBeInTheDocument()
  expect(screen.queryByText(monitor.vi.concurrentUpdate)).toBeNull()
  expect(screen.queryByText('INTERNAL_DIAGNOSTIC')).toBeNull()
  expect(monitoringErrorMessage(error)).toBe(monitor.en.concurrentUpdate)
})

it('provides a translated reason for every evidence blocker', () => {
  expect(Object.keys(messages.en.reasons)).toEqual(
    Object.keys(messages.vi.reasons),
  )
  for (const text of Object.values(messages.en.reasons)) {
    expect(text).not.toMatch(/[ăâđêôơưĂÂĐÊÔƠƯ\u1EA0-\u1EF9]/)
    expect(text.length).toBeGreaterThan(10)
  }
})

it('keeps unsaved observations and translates an existing validation error without submitting', async () => {
  setLanguage('en')
  const update = vi.spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
  const view = render(<MonitoringChecklistSection missionId="mission" loading={false} canExecute
    data={{ missionId: 'mission', legacySnapshot: false, readyForSubmission: false, executions: [item] }} refresh={vi.fn()} />)
  fireEvent.click(view.container.querySelector('.mc-row')!)
  fireEvent.click(screen.getByRole('button', { name: 'Edit item' }))
  fireEvent.change(screen.getByLabelText('Work observations'), { target: { value: 'Ghi chú chưa lưu của nhân viên' } })
  fireEvent.change(screen.getByLabelText('Execution status'), { target: { value: 'UNABLE_TO_VERIFY' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save item' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(monitor.en.reasonRequired)
  act(() => setLanguage('vi'))
  expect(screen.getByRole('alert')).toHaveTextContent(monitor.vi.reasonRequired)
  expect(screen.getByLabelText('Ghi nhận thực hiện')).toHaveValue('Ghi chú chưa lưu của nhân viên')
  expect(update).not.toHaveBeenCalled()
})
