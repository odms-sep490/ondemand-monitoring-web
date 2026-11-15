import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { InternalCorrectionMissionSetup } from './InternalCorrectionMissionSetup'
vi.mock('../../MissionCreate/InternalCorrectionPlanningPage', () => ({
  InternalCorrectionPlanningPage: ({
    orderId,
    sourceMissionId,
    correctionId,
  }: {
    orderId: string
    sourceMissionId: string
    correctionId: string
  }) => (
    <div>
      Shared planning {orderId}/{sourceMissionId}/{correctionId}
    </div>
  ),
}))
it.each(['PLANNING', 'PENDING_CONFIRMATION', 'READY'])(
  'keeps internal %s Missions in the shared planning workspace',
  (status) => {
    render(
      <InternalCorrectionMissionSetup
        mission={
          {
            id: 'child',
            orderId: 'order',
            status,
            inspectionCorrectionId: 'correction',
            inspectionSourceMissionId: 'parent',
          } as never
        }
        onChanged={() => {}}
      />,
    )
    expect(
      screen.getByText('Shared planning order/parent/correction'),
    ).toBeInTheDocument()
  },
)
it('fails closed without its internal origin', () => {
  render(
    <InternalCorrectionMissionSetup
      mission={{ id: 'child', orderId: 'order' } as never}
      onChanged={() => {}}
    />,
  )
  expect(
    screen.getByText('Không thể tải nhiệm vụ để tiếp tục phân công.'),
  ).toBeInTheDocument()
})
