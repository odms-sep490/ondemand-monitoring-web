import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import { ApiError, apiRequest } from '../../../../../shared/api/httpClient'
import { DevicesPage } from '../DevicesPage'

vi.mock('../../../../../shared/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../../../../shared/api/httpClient')
  >()),
  apiRequest: vi.fn(),
}))

const mocked = vi.mocked(apiRequest)

const model = {
  id: 'm1',
  code: 'M350',
  modelName: 'Matrice 350',
  manufacturer: 'DJI',
}
const mkDevice = (
  id: string,
  serial: string,
  name: string,
  status: string,
) => ({
  id,
  serialNumber: serial,
  name,
  deviceModel: model,
  status,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
  version: 1,
})

const devices = [
  mkDevice('d1', 'SN-001', 'Đại Bàng', 'AVAILABLE'),
  mkDevice('d2', 'SN-002', 'Sơn Ca', 'MAINTENANCE'),
  mkDevice('d3', 'SN-003', 'Hải Âu', 'OFFLINE'),
]
const pageOf = (items: unknown[]) => ({
  items,
  page: 0,
  size: 10,
  totalItems: items.length,
  totalPages: 1,
  first: true,
  last: true,
})

function route(overrides: Record<string, (opts: unknown) => unknown> = {}) {
  mocked.mockImplementation(async (path: string, opts?: unknown) => {
    const key = `${(opts as { method?: string } | undefined)?.method ?? 'GET'} ${path}`
    if (overrides[key]) return overrides[key](opts)
    if (key === 'GET /api/devices') return pageOf(devices)
    if (key === 'GET /api/device-models') return [model]
    return {}
  })
}

const calls = (key: string) =>
  mocked.mock.calls.filter(
    ([path, opts]) => `${opts?.method ?? 'GET'} ${path}` === key,
  )

async function pick(label: string, optionText: string, scope?: HTMLElement) {
  const box = within(scope ?? document.body).getByRole('combobox', {
    name: label,
  })
  fireEvent.mouseDown(box)
  const option = await waitFor(() => {
    const el = Array.from(
      document.querySelectorAll<HTMLElement>('.ant-select-item-option-content'),
    ).find((n) => n.textContent === optionText)
    if (!el) throw new Error(`option ${optionText} not found`)
    return el
  })
  fireEvent.click(option)
}

describe('DevicesPage', () => {
  beforeEach(() => {
    mocked.mockReset()
    route()
  })

  it('renders KPI cards and the device rows', async () => {
    render(<DevicesPage />)
    expect(
      screen.getByRole('heading', { name: 'Thiết bị' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Đại Bàng')).toBeInTheDocument()
    expect(screen.getByText('SN-002')).toBeInTheDocument()
    expect(screen.getByText('Tổng thiết bị')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        within(
          screen
            .getByText('Sẵn sàng', { selector: '.mgr-stat-label' })
            .closest('.mgr-stat') as HTMLElement,
        ).getByText('1'),
      ).toBeInTheDocument(),
    )
  })

  it('shows an empty state', async () => {
    route({ 'GET /api/devices': () => pageOf([]) })
    render(<DevicesPage />)
    expect(await screen.findByText('Chưa có thiết bị nào')).toBeInTheDocument()
  })

  it('shows an error state when listing fails', async () => {
    route({
      'GET /api/devices': () => {
        throw new ApiError('boom', {
          status: 500,
          method: 'GET',
          path: '/api/devices',
        })
      },
    })
    render(<DevicesPage />)
    expect(await screen.findByText('boom')).toBeInTheDocument()
  })

  it('sends keyword and status filters to the backend', async () => {
    render(<DevicesPage />)
    await screen.findByText('Đại Bàng')

    fireEvent.change(screen.getByLabelText('Tìm thiết bị'), {
      target: { value: 'SN-002' },
    })
    await waitFor(() =>
      expect(
        calls('GET /api/devices').some(
          ([, o]) => (o?.query as { keyword?: string })?.keyword === 'SN-002',
        ),
      ).toBe(true),
    )

    await pick('Trạng thái', 'Bảo trì')
    await waitFor(() =>
      expect(
        calls('GET /api/devices').some(
          ([, o]) =>
            (o?.query as { status?: string })?.status === 'MAINTENANCE',
        ),
      ).toBe(true),
    )
  })

  it('creates a device and validates required fields', async () => {
    render(<DevicesPage />)
    await screen.findByText('Đại Bàng')
    fireEvent.click(screen.getByRole('button', { name: /Thêm thiết bị/ }))
    const dialog = await screen.findByRole('dialog')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    expect(
      await within(dialog).findByText('Vui lòng nhập số serial.'),
    ).toBeInTheDocument()
    expect(calls('POST /api/devices')).toHaveLength(0)

    fireEvent.change(within(dialog).getByLabelText('Số serial'), {
      target: { value: 'SN-NEW' },
    })
    await pick('Mẫu thiết bị', 'Matrice 350', dialog)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu' }))

    await waitFor(() => expect(calls('POST /api/devices')).toHaveLength(1))
    expect(calls('POST /api/devices')[0][1]?.body).toEqual({
      serialNumber: 'SN-NEW',
      name: undefined,
      modelId: 'm1',
      status: 'AVAILABLE',
    })
    expect(await screen.findByText('Đã thêm thiết bị.')).toBeInTheDocument()
  })

  it('edits a device with PUT', async () => {
    render(<DevicesPage />)
    await screen.findByText('Đại Bàng')
    fireEvent.click(screen.getByLabelText('Sửa SN-001'))
    const dialog = await screen.findByRole('dialog')
    const name = within(dialog).getByLabelText('Tên thiết bị')
    expect(name).toHaveValue('Đại Bàng')
    fireEvent.change(name, { target: { value: 'Đại Bàng 2' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu' }))

    await waitFor(() => expect(calls('PUT /api/devices/d1')).toHaveLength(1))
    expect(calls('PUT /api/devices/d1')[0][1]?.body).toMatchObject({
      serialNumber: 'SN-001',
      name: 'Đại Bàng 2',
      modelId: 'm1',
    })
    expect(await screen.findByText('Đã cập nhật thiết bị.')).toBeInTheDocument()
  })

  it('deletes after confirming in a popconfirm', async () => {
    render(<DevicesPage />)
    await screen.findByText('Đại Bàng')
    fireEvent.click(screen.getByLabelText('Xóa SN-001'))
    expect(await screen.findByText('Xóa thiết bị này?')).toBeInTheDocument()
    expect(calls('DELETE /api/devices/d1')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(calls('DELETE /api/devices/d1')).toHaveLength(1))
    expect(await screen.findByText('Đã xóa thiết bị.')).toBeInTheDocument()
  })

  it('shows a clear message when the backend lacks the endpoint', async () => {
    route({
      'DELETE /api/devices/d1': () => {
        throw new ApiError('Not Found', {
          status: 404,
          method: 'DELETE',
          path: '/api/devices/d1',
        })
      },
    })
    render(<DevicesPage />)
    await screen.findByText('Đại Bàng')
    fireEvent.click(screen.getByLabelText('Xóa SN-001'))
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa' }))
    expect(
      await screen.findByText('Hệ thống chưa hỗ trợ thao tác này.'),
    ).toBeInTheDocument()
  })

  it('opens the detail drawer', async () => {
    render(<DevicesPage />)
    await screen.findByText('Đại Bàng')
    fireEvent.click(screen.getByLabelText('Xem chi tiết SN-001'))
    expect(await screen.findByText('Chi tiết thiết bị')).toBeInTheDocument()
    expect(screen.getByText('Hãng sản xuất')).toBeInTheDocument()
  })
})
