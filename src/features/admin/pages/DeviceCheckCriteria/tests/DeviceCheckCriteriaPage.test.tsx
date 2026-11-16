import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { deviceCheckCriteriaApi, type DeviceCheckCriterion } from '../../../api/deviceCheckCriteriaApi'
import { DeviceCheckCriteriaPage } from '../DeviceCheckCriteriaPage'

vi.mock('../../../api/deviceCheckCriteriaApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/deviceCheckCriteriaApi')>()
  return {
    ...actual,
    deviceCheckCriteriaApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), reorder: vi.fn() },
  }
})

const api = vi.mocked(deviceCheckCriteriaApi)

const rows: DeviceCheckCriterion[] = [
  { id: '1', phase: 'PRE', code: 'battery_health', name: 'Pin máy bay', description: 'Đo % pin', category: 'THIẾT BỊ BAY',
    required: true, active: true, sortOrder: 1, systemLogic: true, version: 0 },
  { id: '2', phase: 'PRE', code: 'propeller_inspection', name: 'Cánh quạt', category: 'THIẾT BỊ BAY',
    required: true, active: true, sortOrder: 2, systemLogic: false, version: 0 },
  { id: '3', phase: 'PRE', code: 'command_link', name: 'Tín hiệu điều khiển', category: 'KẾT NỐI VÀ ĐIỀU KHIỂN',
    required: false, active: false, sortOrder: 3, systemLogic: false, version: 0 },
]

describe('DeviceCheckCriteriaPage', () => {
  beforeEach(() => {
    setLanguage('vi')
    vi.clearAllMocks()
    api.list.mockResolvedValue(rows)
    api.reorder.mockResolvedValue(rows)
  })

  it('renders category lanes with ticket cards', async () => {
    render(<DeviceCheckCriteriaPage />)
    const lane = await screen.findByRole('region', { name: 'THIẾT BỊ BAY' })
    expect(within(lane).getByText('Pin máy bay')).toBeInTheDocument()
    expect(within(lane).getByText('Logic hệ thống')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'KẾT NỐI VÀ ĐIỀU KHIỂN' })).toBeInTheDocument()
    expect(screen.getByText('Đã tắt')).toBeInTheDocument()
    expect(api.list).toHaveBeenCalledWith('PRE', expect.anything())
  })

  it('hides disabled criteria when the toggle is off and switches phase', async () => {
    render(<DeviceCheckCriteriaPage />)
    await screen.findByText('Tín hiệu điều khiển')
    fireEvent.click(screen.getByRole('switch', { name: 'Hiện tiêu chí đang tắt' }))
    expect(screen.queryByText('Tín hiệu điều khiển')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Kiểm tra sau bay'))
    await waitFor(() => expect(api.list).toHaveBeenCalledWith('POST', expect.anything()))
  })

  it('reorders with the move buttons', async () => {
    render(<DeviceCheckCriteriaPage />)
    await screen.findByText('Cánh quạt')
    fireEvent.click(screen.getByRole('button', { name: 'Đưa lên: Cánh quạt' }))
    expect(api.reorder).toHaveBeenCalledWith('PRE', ['2', '1', '3'])
  })

  it('opens the side panel to create a criterion', async () => {
    api.create.mockResolvedValue({ ...rows[1], id: '9', name: 'Đèn định vị' })
    render(<DeviceCheckCriteriaPage />)
    await screen.findByText('Cánh quạt')
    fireEvent.click(screen.getByRole('button', { name: /Thêm tiêu chí/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    expect(within(dialog).getByText('Vui lòng nhập tên tiêu chí')).toBeInTheDocument()
    expect(api.create).not.toHaveBeenCalled()
    const inputs = within(dialog).getAllByRole('textbox')
    fireEvent.change(inputs[1], { target: { value: 'Đèn định vị' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ phase: 'PRE', name: 'Đèn định vị', required: true })),
    )
  })
})
