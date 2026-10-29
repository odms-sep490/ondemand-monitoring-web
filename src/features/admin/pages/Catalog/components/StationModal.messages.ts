import { defineMessages } from '../../../../../shared/i18n'

export const stationModalMessages = defineMessages({
  vi: {
    createTitle: 'Tạo trạm mới',
    editTitle: 'Sửa trạm',
    subtitle: 'Trạm xuất phát của thiết bị bay',
    code: 'Mã trạm',
    name: 'Tên trạm',
    address: 'Địa chỉ',
    lat: 'Vĩ độ',
    lon: 'Kinh độ',
    radius: 'Bán kính phục vụ tối đa (m)',
    required: 'Bắt buộc',
    genericError: 'Lỗi khi lưu trạm.',
  },
  en: {
    createTitle: 'Create new station',
    editTitle: 'Edit station',
    subtitle: 'Drone launch station',
    code: 'Station code',
    name: 'Station name',
    address: 'Address',
    lat: 'Latitude',
    lon: 'Longitude',
    radius: 'Max service radius (m)',
    required: 'Required',
    genericError: 'Failed to save the station.',
  },
})
