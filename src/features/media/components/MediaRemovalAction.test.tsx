import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MediaRemovalAction } from './MediaRemovalAction'
import { operatorMediaApi, type LocalMedia } from '../api/operatorMediaApi'
import { ApiError } from '../../../shared/api/httpClient'
vi.mock('../api/operatorMediaApi', () => ({ operatorMediaApi: { removeStaffMedia: vi.fn() } }))
const item: LocalMedia = { missionId: 'exact-mission', backendMediaId: 'media-1', localMediaId: 'staff-file', deviceId: 'device-1', fileName: 'drone.jpg', mediaType: 'IMAGE', contentType: 'image/jpeg', checksumSha256: '', fileSize: 100, capturedAt: '2026-11-10T01:00:00Z', status: 'AVAILABLE', staffCreated: true, version: 7 }
const error = (code: string) => new ApiError(code, { code, status: 409, method: 'POST', path: '/removal' })
beforeEach(() => { vi.clearAllMocks(); vi.mocked(operatorMediaApi.removeStaffMedia).mockResolvedValue({ mediaId: 'media-1', removed: true, cleanupScheduled: true }) })
function open() {fireEvent.click(screen.getByRole('button', { name: 'Gỡ ảnh/video: drone.jpg' }))}
describe('Remove mistaken Staff upload', () => {
  it('requires a reason and submits exact Mission, media, displayed version and trimmed reason', async () => {
    const changed=vi.fn();render(<MediaRemovalAction item={item} canRemove onRemoved={changed} />);open()
    const submit=screen.getByRole('button',{name:'Xác nhận gỡ'});expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Lý do gỡ'),{target:{value:'  Chọn nhầm ảnh  '}});fireEvent.click(submit)
    await waitFor(() => expect(changed).toHaveBeenCalledWith('media-1'))
    expect(operatorMediaApi.removeStaffMedia).toHaveBeenCalledWith('exact-mission','media-1',7,'Chọn nhầm ảnh')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it.each([{...item,staffCreated:false},{...item,version:undefined}])('does not offer removal for a controller origin or an unversioned row', row => {
    const {container}=render(<MediaRemovalAction item={row} canRemove onRemoved={vi.fn()} />);expect(container).toBeEmptyDOMElement()
  })
  it('hides removal without backend upload permission', () => {const {container}=render(<MediaRemovalAction item={item} canRemove={false} onRemoved={vi.fn()} />);expect(container).toBeEmptyDOMElement()})
  it('cancel never calls the API', () => {render(<MediaRemovalAction item={item} canRemove onRemoved={vi.fn()} />);open();fireEvent.click(screen.getByRole('button',{name:'Hủy'}));expect(operatorMediaApi.removeStaffMedia).not.toHaveBeenCalled()})
  it('localizes protection errors, keeps the dialog and never retries automatically', async () => {
    vi.mocked(operatorMediaApi.removeStaffMedia).mockRejectedValue(error('MEDIA_EVIDENCE_PROTECTED'))
    const changed=vi.fn();render(<MediaRemovalAction item={item} canRemove onRemoved={changed} />);open()
    fireEvent.change(screen.getByLabelText('Lý do gỡ'),{target:{value:'Nhầm'}});fireEvent.click(screen.getByRole('button',{name:'Xác nhận gỡ'}))
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa thể gỡ ảnh/video này')
    expect(screen.getByRole('alert')).not.toHaveTextContent('MEDIA_EVIDENCE_PROTECTED');expect(changed).not.toHaveBeenCalled();expect(operatorMediaApi.removeStaffMedia).toHaveBeenCalledOnce()
  })
  it('holds the version seen on opening the dialog and blocks stale-version resubmission', async () => {
    vi.mocked(operatorMediaApi.removeStaffMedia).mockRejectedValue(error('CONCURRENT_UPDATE'))
    const {rerender}=render(<MediaRemovalAction item={item} canRemove onRemoved={vi.fn()} />);open()
    rerender(<MediaRemovalAction item={{...item,version:8}} canRemove onRemoved={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Lý do gỡ'),{target:{value:'Nhầm'}});fireEvent.click(screen.getByRole('button',{name:'Xác nhận gỡ'}))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ảnh/video đã thay đổi')
    expect(operatorMediaApi.removeStaffMedia).toHaveBeenCalledWith('exact-mission','media-1',7,'Nhầm')
    expect(screen.getByRole('button',{name:'Xác nhận gỡ'})).toBeDisabled()
  })
  it('does not fake success when the server did not confirm removal', async () => {
    vi.mocked(operatorMediaApi.removeStaffMedia).mockResolvedValue({ mediaId:'other',removed:false,cleanupScheduled:false })
    const changed=vi.fn();render(<MediaRemovalAction item={item} canRemove onRemoved={changed} />);open()
    fireEvent.change(screen.getByLabelText('Lý do gỡ'),{target:{value:'Nhầm'}});fireEvent.click(screen.getByRole('button',{name:'Xác nhận gỡ'}))
    await screen.findByRole('alert');expect(changed).not.toHaveBeenCalled()
  })
})
