import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { deliveryApi } from './api'
import { MissionDeliveryTabs } from './MissionDeliveryTabs'
import { setLanguage } from '../../shared/i18n'

beforeEach(() => {
  setLanguage('en')
  vi.spyOn(deliveryApi, 'missionDeliveries').mockResolvedValue([
    { missionId: 'one', missionCode: 'MS-001', status: 'CUSTOMER_REVIEW' },
    {
      missionId: 'two',
      missionCode: 'MS-002',
      status: 'PROCESSING',
      relatedMissionIds: ['two', 'rework-two'],
    },
  ])
})
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

function Draft({ id }: { id?: string }) {
  const [note, setNote] = useState('')
  return (
    <>
      <span>Scope: {id ?? 'legacy'}</span>
      <input
        aria-label="Draft"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </>
  )
}

it('keeps a completed mission available while another mission is processing and resets local draft state on switch', async () => {
  render(
    <MissionDeliveryTabs orderId="order">
      {(id) => <Draft id={id} />}
    </MissionDeliveryTabs>,
  )
  expect(await screen.findByText('Scope: one')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Draft'), {
    target: { value: 'Only for mission one' },
  })
  fireEvent.click(screen.getByRole('tab', { name: 'MS-002' }))
  expect(screen.getByText('Scope: two')).toBeInTheDocument()
  expect(screen.getByLabelText('Draft')).toHaveValue('')
})

it('opens the relevant original mission group when entered from a rework mission', async () => {
  render(
    <MissionDeliveryTabs orderId="order" manager initialMissionId="rework-two">
      {(id) => <Draft id={id} />}
    </MissionDeliveryTabs>,
  )
  expect(await screen.findByText('Scope: two')).toBeInTheDocument()
  expect(deliveryApi.missionDeliveries).toHaveBeenCalledWith(
    'order',
    true,
    expect.any(AbortSignal),
  )
})

it('preserves the legacy view for historical order-level deliveries', async () => {
  vi.mocked(deliveryApi.missionDeliveries).mockResolvedValue([])
  render(
    <MissionDeliveryTabs orderId="order">
      {(id) => <Draft id={id} />}
    </MissionDeliveryTabs>,
  )
  expect(await screen.findByText('Scope: legacy')).toBeInTheDocument()
})

it('does not fall back to the order-level state when the mission request fails', async () => {
  vi.mocked(deliveryApi.missionDeliveries).mockRejectedValueOnce(
    new Error('offline'),
  )
  render(
    <MissionDeliveryTabs orderId="order">
      {(id) => <Draft id={id} />}
    </MissionDeliveryTabs>,
  )
  expect(
    await screen.findByText('Could not load mission deliveries.'),
  ).toBeInTheDocument()
  expect(screen.queryByText('Scope: legacy')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  await waitFor(() =>
    expect(screen.getByText('Scope: one')).toBeInTheDocument(),
  )
})
