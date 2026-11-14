import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { MissionListTable } from '../components/MissionListTable'
import type { OperatorMission } from '../../../types/mission'
import { operatorHref } from '../../../routes'

const missions: OperatorMission[] = [
  {
    id: 'MSN-1',
    status: 'PENDING',
    title: 'Kiểm tra nhiệt',
    location: 'KCN Hiệp Phước',
    date: '2026-09-24',
    startTime: '13:00',
    endTime: '14:00',
    serviceLabel: 'Kiểm tra nhiệt',
    droneCode: null,
    droneName: null,
  },
]

describe('MissionListTable', () => {
  it('fails closed when permissions cannot be loaded in pending review', () => {
    render(
      <MissionListTable
        missions={[
          {
            ...missions[0],
            status: 'PENDING_REVIEW',
            backendStatus: 'PENDING_REVIEW',
          },
        ]}
        now={new Date()}
      />,
    )
    expect(
      screen
        .getAllByRole('link')
        .some((link) => link.getAttribute('href')?.includes('/connect/')),
    ).toBe(false)
  })
  it('routes a monitoring actor in pending review to detail, not back to connect', () => {
    render(
      <MissionListTable
        missions={[
          {
            ...missions[0],
            status: 'ACCEPTED',
            backendStatus: 'PENDING_REVIEW',
            permissions: {
              canControlFlight: false,
              canOperatePayload: true,
              canInspectDevice: false,
              canMaintainDevice: false,
              canUploadMedia: false,
              canExecuteMonitoringChecklist: true,
            },
          },
        ]}
        now={new Date()}
      />,
    )
    const links = screen.getAllByRole('link')
    expect(
      links.some(
        (link) =>
          link.getAttribute('href') ===
          operatorHref({ screen: 'missionDetail', missionId: 'MSN-1' }),
      ),
    ).toBe(true)
    expect(
      links.some((link) => link.getAttribute('href')?.includes('/connect/')),
    ).toBe(false)
  })
  it('renders vietnamese column headers and status label', () => {
    render(
      <MissionListTable
        missions={missions}
        now={new Date('2026-09-20T00:00:00+07:00')}
      />,
    )
    expect(screen.getByText('Mã mission')).toBeTruthy()
    expect(screen.getByText('Chờ phản hồi')).toBeTruthy()
    expect(screen.getByText('Không phân công')).toBeTruthy()
  })

  it('uses backend lifecycle status instead of exposing raw SCHEDULED', () => {
    render(
      <MissionListTable
        missions={[
          {
            ...missions[0],
            status: 'ACCEPTED',
            backendStatus: 'SCHEDULED',
          },
        ]}
        now={new Date('2026-09-20T00:00:00+07:00')}
      />,
    )

    expect(screen.getByText('Đang chuẩn bị trước bay')).toBeInTheDocument()
    expect(screen.queryByText('SCHEDULED')).not.toBeInTheDocument()
  })

  it('translates the backend pending confirmation status into Vietnamese', () => {
    act(() => setLanguage('vi'))
    render(
      <MissionListTable
        missions={[
          {
            ...missions[0],
            status: 'PENDING_CONFIRMATION',
            backendStatus: 'PENDING_CONFIRMATION',
          },
        ]}
        now={new Date('2026-09-20T00:00:00+07:00')}
      />,
    )

    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument()
    expect(screen.queryByText('PENDING_CONFIRMATION')).not.toBeInTheDocument()
  })

  it('renders english column headers and status label when language is switched', () => {
    render(
      <MissionListTable
        missions={missions}
        now={new Date('2026-09-20T00:00:00+07:00')}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Mission code')).toBeTruthy()
    expect(screen.getByText('Awaiting reply')).toBeTruthy()
    expect(screen.getByText('Unassigned')).toBeTruthy()
  })

  it('shows the device code instead of the internal device id', () => {
    render(
      <MissionListTable
        missions={[
          {
            ...missions[0],
            deviceId: '390b6b53-00a1-446c-abb2-93d8ffcd6454',
            droneCode: 'DRN-02',
          },
        ]}
        now={new Date('2026-09-20T00:00:00+07:00')}
      />,
    )
    expect(screen.getByText('DRN-02')).toBeTruthy()
    expect(
      screen.queryByText('390b6b53-00a1-446c-abb2-93d8ffcd6454'),
    ).toBeNull()
  })

  it('shows a new replacement request instead of the prior completed badge', () => {
    render(
      <MissionListTable
        missions={[
          {
            ...missions[0],
            deviceReplacementCompleted: true,
            deviceReplacementRequested: true,
          },
        ]}
        now={new Date('2026-09-20T00:00:00+07:00')}
      />,
    )

    const request = screen.getByText('Yêu cầu đổi drone')
    expect(request.tagName).toBe('SPAN')
    expect(request).toHaveStyle({ color: 'var(--red-fg)' })
    expect(screen.queryByText('Đã đổi drone')).toBeNull()
  })

  it('renders the vietnamese empty state', () => {
    render(<MissionListTable missions={[]} now={new Date()} />)
    expect(screen.getByText('Không có mission')).toBeTruthy()
  })
})
