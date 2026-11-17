import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { MissionHeader } from '../components/MissionHeader'
import type { OperatorMission } from '../../../types/mission'
import { setLanguage } from '../../../../../shared/i18n'

it('shows only the main inspection entry when Staff has both Pilot and Inspector permissions', () => {
  setLanguage('vi')
  render(<MissionHeader mission={{ id: 'm', missionCode: 'MS-1', status: 'IN_PROGRESS', backendStatus: 'IN_PROGRESS', actualEndAt: '2026-11-16T12:00:00Z', myResponseStatus: 'ACCEPTED' } as OperatorMission}
    access={{ canRespond: false, canControlFlight: true, canOperatePayload: false, canInspectDevice: true, canMaintainDevice: false, canUploadMedia: true, canAccessMissionInspection: true, canAttachChecklistEvidence: true }} />)
  expect(screen.getAllByRole('link', { name: 'Mở nghiệm thu nhiệm vụ' })).toHaveLength(1)
  expect(screen.getByRole('link', { name: 'Mở nghiệm thu nhiệm vụ' })).toHaveAttribute('href', '#portal/staff/inspection/m')
  expect(screen.queryByRole('link', { name: 'Chuẩn bị hồ sơ nghiệm thu' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Mở buồng lái' })).toBeNull()
  expect(screen.queryAllByRole('link').filter(link => link.getAttribute('href')?.includes('/checklist/'))).toHaveLength(0)
})
