import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  checklistsApi,
  type ChecklistDefinition,
  type ServiceChecklist,
} from '../../api/checklistsApi'
import { ChecklistPicker } from './ChecklistPicker'

const a: ChecklistDefinition = {
  id: 'a',
  content: 'Checklist A',
  isActive: true,
  version: 0,
  createdAt: '',
  updatedAt: null,
}
const b = { ...a, id: 'b', content: 'Checklist B' }
const c = { ...a, id: 'c', content: 'Checklist C' }
const page = (items: ChecklistDefinition[], index = 0, total = 1) => ({
  items,
  page: index,
  totalItems: items.length,
  totalPages: total,
  first: index === 0,
  last: index === total - 1,
})
const link = (id: string, order = 0): ServiceChecklist => ({
  id: `link-${id}`,
  serviceId: 's',
  serviceName: 'Service',
  serviceActive: true,
  checklistId: id,
  content: `Checklist ${id}`,
  checklistActive: true,
  displayOrder: order,
  version: 0,
  checklistVersion: 0,
})
function show() {
  const saved = vi.fn(),
    changed = vi.fn()
  render(
    <ChecklistPicker
      serviceId="s"
      rows={[]}
      close={vi.fn()}
      saved={saved}
      changed={changed}
    />,
  )
  return { saved, changed }
}
beforeEach(() => {
  vi.spyOn(checklistsApi, 'list').mockResolvedValue(page([a, b]))
  vi.spyOn(checklistsApi, 'template').mockResolvedValue([])
  vi.spyOn(checklistsApi, 'assign').mockImplementation(
    async (_service, id, order) => link(id, order),
  )
})
afterEach(() => vi.restoreAllMocks())

it('keeps selection across pagination and search, and clears the entire selection', async () => {
  vi.mocked(checklistsApi.list).mockImplementation(
    async (search, _active, index) =>
      search ? page([c]) : page(index === 1 ? [b] : [a], index ?? 0, 2),
  )
  show()
  fireEvent.click(await screen.findByRole('checkbox', { name: a.content }))
  fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
  fireEvent.click(await screen.findByRole('checkbox', { name: b.content }))
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'C' } })
  await screen.findByRole('checkbox', { name: c.content })
  expect(screen.getByRole('status')).toHaveTextContent('Đã chọn 2 checklist')
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
  expect(await screen.findByRole('checkbox', { name: a.content })).toBeChecked()
  fireEvent.click(screen.getByRole('button', { name: 'Bỏ chọn tất cả' }))
  expect(screen.getByRole('status')).toHaveTextContent('Đã chọn 0 checklist')
  expect(screen.getByRole('button', { name: 'Thêm checklist' })).toBeDisabled()
})
it('selects a page and assigns each checklist once in selection order', async () => {
  const { saved } = show()
  await screen.findByRole('checkbox', { name: a.content })
  fireEvent.click(
    screen.getByRole('button', { name: 'Chọn tất cả trên trang' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Thêm 2 checklist' }))
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1))
  expect(checklistsApi.assign).toHaveBeenNthCalledWith(1, 's', 'a', 0)
  expect(checklistsApi.assign).toHaveBeenNthCalledWith(2, 's', 'b', 1)
})
it('retains only failed and unattempted selections after partial success and safely retries', async () => {
  vi.mocked(checklistsApi.template)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([link('a')])
  vi.mocked(checklistsApi.assign)
    .mockResolvedValueOnce(link('a'))
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValueOnce(link('b', 1))
  const { saved, changed } = show()
  await screen.findByRole('checkbox', { name: a.content })
  fireEvent.click(
    screen.getByRole('button', { name: 'Chọn tất cả trên trang' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Thêm 2 checklist' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Đã gắn 1/2 checklist',
  )
  expect(changed).toHaveBeenCalledTimes(1)
  expect(saved).not.toHaveBeenCalled()
  expect(await screen.findByRole('checkbox', { name: b.content })).toBeChecked()
  expect(screen.queryByRole('checkbox', { name: a.content })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Thêm 1 checklist' }))
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1))
  expect(checklistsApi.assign).toHaveBeenCalledTimes(3)
  expect(checklistsApi.assign).toHaveBeenNthCalledWith(3, 's', 'b', 1)
})
it('reconciles an assignment committed before a lost response without posting it twice', async () => {
  vi.mocked(checklistsApi.template)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([link('a')])
  vi.mocked(checklistsApi.assign).mockRejectedValueOnce(
    new Error('Connection lost'),
  )
  const { saved } = show()
  fireEvent.click(await screen.findByRole('checkbox', { name: a.content }))
  fireEvent.click(screen.getByRole('button', { name: 'Thêm 1 checklist' }))
  await screen.findByRole('alert')
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Thêm 1 checklist' }),
    ).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Thêm 1 checklist' }))
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1))
  expect(checklistsApi.assign).toHaveBeenCalledTimes(1)
})
