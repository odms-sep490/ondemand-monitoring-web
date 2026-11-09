import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MissionExecutionPanel } from '../components/MissionExecutionPanel'
import { missionsApi } from '../../../api/missionsApi'
import { checklistExecutionApi } from '../../../../mission/api/checklistExecutionApi'
import type {
  MissionResponse,
  MissionStaffAssignmentResponse,
} from '../../../types/missions'

afterEach(() => vi.restoreAllMocks())

// The Order-level execution panel is now a compact progress/resources summary:
// it renders the Mission it is given and no longer loads checklist or media
// (those live on the Mission detail page, reached through the link).
const staff = (
  id: string,
  staffName: string,
  assignedRole: MissionStaffAssignmentResponse['assignedRole'],
  responseStatus: MissionStaffAssignmentResponse['responseStatus'],
) =>
  ({
    id: `${id}-${assignedRole}`,
    staffId: id,
    staffName,
    staffEmail: null,
    assignedRole,
    responseStatus,
  }) as MissionStaffAssignmentResponse

const mission = (id: string, overrides: Partial<MissionResponse> = {}) =>
  ({
    id,
    missionCode: id.toUpperCase(),
    status: 'PLANNING',
    deviceAssignments: [],
    staffAssignments: [],
    ...overrides,
  }) as unknown as MissionResponse

it('shows only the selected Mission after switching from M1 to M2', () => {
  const view = render(
    <MissionExecutionPanel
      key="m1"
      mission={mission('m1', {
        staffAssignments: [staff('s1', 'Nhân sự M1', 'PILOT', 'ACCEPTED')],
      })}
    />,
  )
  expect(screen.getByRole('heading', { name: 'M1' })).toBeInTheDocument()
  expect(screen.getByText('Nhân sự M1')).toBeInTheDocument()

  view.rerender(
    <MissionExecutionPanel
      key="m2"
      mission={mission('m2', {
        staffAssignments: [staff('s2', 'Nhân sự M2', 'OPERATOR', 'PENDING')],
      })}
    />,
  )
  expect(screen.getByRole('heading', { name: 'M2' })).toBeInTheDocument()
  expect(screen.getByText('Nhân sự M2')).toBeInTheDocument()
  expect(screen.queryByText('Nhân sự M1')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Mở chi tiết Mission' })).toHaveAttribute(
    'href',
    '#portal/manager/missions/m2/detail',
  )
})

it('summarizes staff confirmation and assigned devices without loading checklist or media', () => {
  const getChecklist = vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  )
  const getMedia = vi.spyOn(missionsApi, 'getMissionMedia')
  const getResult = vi.spyOn(missionsApi, 'getMissionResult')
  render(
    <MissionExecutionPanel
      mission={mission('m1', {
        staffAssignments: [
          staff('s1', 'Nguyễn Minh', 'PILOT', 'ACCEPTED'),
          staff('s2', 'Trần An', 'INSPECTOR', 'PENDING'),
        ],
        deviceName: 'Drone khảo sát',
        deviceCode: 'DRN-0052',
      })}
    />,
  )

  expect(screen.getByText('1/2 nhân sự đã xác nhận')).toBeInTheDocument()
  expect(screen.getByText('Nguyễn Minh')).toBeInTheDocument()
  expect(screen.getByText('Trần An')).toBeInTheDocument()
  expect(screen.getByText('1 thiết bị được phân công')).toBeInTheDocument()
  expect(screen.getByText('Drone khảo sát')).toBeInTheDocument()
  expect(getChecklist).not.toHaveBeenCalled()
  expect(getMedia).not.toHaveBeenCalled()
  expect(getResult).not.toHaveBeenCalled()
})

it('shows an explicit not-assigned state when a Mission has no resources', () => {
  render(<MissionExecutionPanel mission={mission('m1')} />)

  expect(screen.getByText('0 thiết bị được phân công')).toBeInTheDocument()
  expect(screen.getAllByText('Chưa được phân công')).toHaveLength(3)
})
