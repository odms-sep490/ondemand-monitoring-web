import { afterEach, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import * as authApi from '../../auth/api/authApi'
import {
  setHttpTransport,
  resetHttpTransport,
} from '../../../shared/api/httpClient'
import { MissionUploadedMedia } from '../../media/components/MissionUploadedMedia'
import { ChecklistEvidencePanel } from './ChecklistEvidencePanel'
import type {
  MissionChecklistExecution,
  EvidenceCandidate,
} from '../types/checklistExecution'

const item = {
  id: 'execution-1',
  content: 'Quan sát khu vực',
  executionStatus: 'COMPLETED',
  version: 2,
  evidence: [],
} as unknown as MissionChecklistExecution
const assetId = 'existing-media-asset'
const preview = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'
const candidate: EvidenceCandidate = {
  mediaId: assetId,
  fileName: 'satellite.jpg',
  mediaType: 'IMAGE',
  contentType: 'image/jpeg',
  status: 'PENDING_MANAGER_APPROVAL',
  sourceType: 'SATELLITE_SNAPSHOT',
  capturedAt: '2026-10-09T15:00:00Z',
  validatedAt: '2026-10-09T15:01:00Z',
  attachable: true,
  eligibleForOperationalReadiness: true,
  eligibleForFinalApproval: false,
  ineligibilityReason: null,
  previewUrl: preview,
  urlExpiresAt: null,
  alreadyAttachedExecutionIds: [],
}
function backend() {
  const transport = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input)
    if (url.pathname.endsWith('/result'))
      return new Response('{}', { status: 404 })
    let data: unknown
    if (url.pathname === '/api/missions/exact-mission/media')
      data = [
        {
          id: assetId,
          missionId: 'exact-mission',
          type: 'IMAGE',
          contentType: 'image/jpeg',
          sourceType: 'SATELLITE_SNAPSHOT',
          url: preview,
          capturedAt: candidate.capturedAt,
        },
      ]
    else if (
      url.pathname ===
      '/api/missions/exact-mission/checklist-evidence/candidates'
    )
      data = [candidate]
    else if (
      url.pathname ===
        '/api/missions/exact-mission/checklist-executions/execution-1/evidence/existing-media-asset' &&
      init?.method === 'PUT'
    )
      data = []
    else throw new Error('Unexpected request: ' + url.pathname)
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.spyOn(authApi, 'authenticatedFetch').mockImplementation(transport)
  setHttpTransport(transport)
  return transport
}
afterEach(() => {
  resetHttpTransport()
  vi.restoreAllMocks()
})

it('acceptance gallery and picker see the same eligible pending satellite MediaAsset via real response envelopes', async () => {
  const transport = backend()
  render(
    <>
      <MissionUploadedMedia missionId="exact-mission" />
      <ChecklistEvidencePanel
        missionId="exact-mission"
        item={item}
        canAttach
        canDetach={false}
        refresh={vi.fn()}
      />
    </>,
  )
  await waitFor(() =>
    expect(
      screen
        .getByRole('region', { name: 'Media đã upload của mission' })
        .querySelector('img'),
    ).toHaveAttribute('src', preview),
  )
  fireEvent.click(screen.getByText('Thêm bằng chứng từ media của nhiệm vụ'))
  const dialog = within(screen.getByRole('dialog'))
  expect(await dialog.findByAltText('Xem trước satellite.jpg')).toHaveAttribute(
    'src',
    preview,
  )
  expect(dialog.getByText('Gắn media')).toBeEnabled()
  const candidateRequest = transport.mock.calls.find(([url]) =>
    url.includes('/checklist-evidence/candidates'),
  )!
  expect(new URL(candidateRequest[0]).pathname).toBe(
    '/api/missions/exact-mission/checklist-evidence/candidates',
  )
  expect(new URL(candidateRequest[0]).searchParams.get('page')).toBe('0')
  expect(new URL(candidateRequest[0]).searchParams.get('size')).toBe('50')
  fireEvent.click(dialog.getByText('Gắn media'))
  await waitFor(() =>
    expect(
      transport.mock.calls.some(
        ([url, init]) =>
          url.endsWith('/evidence/' + assetId) && init?.method === 'PUT',
      ),
    ).toBe(true),
  )
  const put = transport.mock.calls.find(([, init]) => init?.method === 'PUT')!
  expect(put[1]?.body).toBe(JSON.stringify({ expectedVersion: 2 }))
  expect(
    transport.mock.calls.filter(([, init]) => init?.method === 'PUT'),
  ).toHaveLength(1)
  expect(
    transport.mock.calls.some(([url]) =>
      /upload|register/.test(new URL(url).pathname),
    ),
  ).toBe(false)
})
