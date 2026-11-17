import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MonitoringChecklistSection } from './MonitoringChecklistSection'

vi.mock('../inspection/InspectionCorrectionPanel', () => ({
  InspectionCorrectionPanel: () => <div>Existing correction workflow</div>,
}))

it('keeps correction requests visible while assessment is locked without adding a crew handoff step', () => {
  render(<MonitoringChecklistSection missionId="m" loading={false}
    data={{ missionId: 'm', legacySnapshot: false, readyForSubmission: false, executions: [] }}
    canAssess={false} canExecute={false} canAttach={false}
    showInspectionCorrections refresh={vi.fn()} />)
  expect(screen.getByText('Existing correction workflow')).toBeInTheDocument()
  expect(screen.queryByText('Hồ sơ nghiệm thu')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Gửi hồ sơ nghiệm thu' })).toBeNull()
})
