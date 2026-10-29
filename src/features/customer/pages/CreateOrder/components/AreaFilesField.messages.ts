import { defineMessages } from '../../../../../shared/i18n'

export const areaFilesFieldMessages = defineMessages({
  vi: {
    label: 'KML, GeoJSON, bản vẽ',
    drop: 'Kéo thả tệp hoặc',
    choose: 'chọn tệp',
    meta: 'Hỗ trợ: KML, GeoJSON, PDF, DXF, ảnh bản vẽ. Tối đa 5 tệp, mỗi tệp 5 MB.',
    hint: 'Với tệp KML hoặc GeoJSON, hệ thống sẽ tự đặt vị trí, bán kính và chiều dài theo tệp.',
    applied: (name: string) => `Đã áp dụng vị trí từ ${name}.`,
    unreadable: (name: string) =>
      `Không đọc được tọa độ trong ${name}. Tệp vẫn được đính kèm.`,
    tooLarge: (name: string) => `${name} vượt quá 5 MB.`,
    tooMany: 'Chỉ đính kèm tối đa 5 tệp.',
    unsupported: (name: string) => `${name} không phải định dạng được hỗ trợ.`,
    removeNamed: (name: string) => `Xóa tệp ${name}`,
  },
  en: {
    label: 'KML, GeoJSON, drawings',
    drop: 'Drag and drop files or',
    choose: 'choose files',
    meta: 'Supported: KML, GeoJSON, PDF, DXF, drawing images. Up to 5 files, 5 MB each.',
    hint: 'For KML or GeoJSON files, the location, radius and length are filled in from the file.',
    applied: (name: string) => `Location applied from ${name}.`,
    unreadable: (name: string) =>
      `Could not read coordinates in ${name}. The file is still attached.`,
    tooLarge: (name: string) => `${name} is larger than 5 MB.`,
    tooMany: 'You can attach at most 5 files.',
    unsupported: (name: string) => `${name} is not a supported format.`,
    removeNamed: (name: string) => `Remove file ${name}`,
  },
})
