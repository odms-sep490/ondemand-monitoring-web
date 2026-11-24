import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { AvailableDrone } from '../../../../staff/api/droneApi'
import type { DeviceResponse } from '../../../types/drones'
import { DroneFleetRoom } from './DroneFleetRoom'

vi.mock('./DroneRoomScene', () => ({
  DroneRoomScene: ({
    drones,
    label,
    bayCountLabel,
  }: {
    drones: AvailableDrone[]
    label: string
    bayCountLabel?: string
  }) => (
    <div role="region" aria-label={label} data-testid="drone-scene-count">
      {drones.length}
      {bayCountLabel && <span>{bayCountLabel}</span>}
    </div>
  ),
}))

const drones = Array.from({ length: 18 }, (_, index) => ({
  id: `drone-${index + 1}`,
  serialNumber: `SERIAL-${index + 1}`,
  name: `Drone ${index + 1}`,
  deviceModel: null,
  status: 'AVAILABLE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  version: 1,
}) as DeviceResponse)

describe('DroneFleetRoom', () => {
  it('renders every API drone in the room and the device list without a six-drone page limit', async () => {
    const { container } = render(
      <DroneFleetRoom
        drones={drones}
        loading={false}
        error={undefined}
        onRetry={vi.fn()}
        onChangeStatus={vi.fn()}
      />,
    )

    expect(await screen.findByTestId('drone-scene-count')).toHaveTextContent('18')
    expect(container.querySelectorAll('.mgr-drone-room-device')).toHaveLength(18)
    expect(screen.getByText('18 bệ drone')).toBeInTheDocument()

    // Switch to the Fleet tab and select a different drone
    fireEvent.click(screen.getByRole('tab', { name: /Danh sách/ }))
    const rows = container.querySelectorAll<HTMLButtonElement>('.mgr-drone-room-device')
    fireEvent.click(rows[2])
    expect(rows[2].getAttribute('aria-pressed')).toBe('true')
  })
})
