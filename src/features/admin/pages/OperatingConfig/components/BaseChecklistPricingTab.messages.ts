import { defineMessages } from '../../../../../shared/i18n'

export const baseChecklistPricingMessages = defineMessages({
  vi: {
    title: 'Giá Base Checklist',
    description:
      'Cấu hình giá gốc theo diện tích chuẩn và đơn giá ảnh/video vượt số lượng đã bao gồm cho từng checklist.',
    name: 'Base Checklist',
    packages: 'Gói dịch vụ áp dụng',
    noPackages: 'Chưa thuộc gói nào',
    searchLabel: 'Tìm checklist',
    searchPlaceholder: 'Tên checklist hoặc tên gói',
    packageFilter: 'Lọc theo gói',
    allPackages: 'Tất cả gói',
    unassignedPackage: 'Chưa thuộc gói nào',
    clearFilters: 'Xóa bộ lọc',
    resultCount: (visible: number, total: number) =>
      visible + '/' + total + ' checklist',
    noResults: 'Không tìm thấy checklist phù hợp.',
    unsavedCount: (count: number) => count + ' dòng chưa lưu',
    saveAll: 'Lưu tất cả thay đổi',
    unsaved: 'Chưa lưu',
    invalidPriceFor: (name: string) =>
      'Giá gốc của "' + name + '" phải là số nguyên không âm.',
    invalidAreaFor: (name: string) =>
      'Diện tích tiêu chuẩn của "' + name + '" phải lớn hơn 0.',
    invalidMediaPriceFor: (name: string) =>
      'Giá ảnh/video bổ sung của "' + name + '" phải là số nguyên không âm.',
    savedMany: (count: number) => 'Đã lưu giá cho ' + count + ' checklist.',
    savedPartially: (saved: number, total: number) =>
      'Đã lưu ' + saved + '/' + total + ' checklist trước khi gặp lỗi.',
    basePrice: 'Giá gốc (VNĐ)',
    standardArea: 'Diện tích tiêu chuẩn (ha)',
    extraImagePrice: 'Giá ảnh vượt mức (VNĐ/ảnh)',
    extraVideoPrice: 'Giá video vượt mức (VNĐ/video)',
    mediaPrices: 'Đơn giá ảnh / video bổ sung',
    imageUnit: 'Ảnh',
    videoUnit: 'Video',
    preview: 'Giá tại diện tích mẫu',
    sampleArea: 'Diện tích mẫu theo order (ha)',
    sampleAreaHint: (area: string) =>
      'Giá được xem trước theo diện tích vùng: ' +
      area +
      '. Phí ảnh/video vượt mức sẽ cộng theo đơn giá bên dưới khi khách yêu cầu thêm.',
    invalidSampleArea: 'Nhập diện tích lớn hơn 0 ha.',
    showPreview: 'Xem trước',
    save: 'Lưu giá',
    active: 'Đang áp dụng',
    inactive: 'Ngừng áp dụng',
    missingArea: 'Chưa cấu hình diện tích tiêu chuẩn',
    empty: 'Chưa có Base Checklist.',
    loading: 'Đang tải cấu hình giá…',
    loadError: 'Không thể tải cấu hình giá.',
    invalidArea: 'Nhập diện tích tiêu chuẩn lớn hơn 0 ha.',
    invalidPrice: 'Nhập giá gốc là số nguyên không âm.',
    invalidMediaPrice: 'Nhập giá ảnh/video bổ sung là số nguyên không âm.',
    saved: 'Đã lưu giá cho Base Checklist.',
    saveError: 'Không thể lưu cấu hình giá. Vui lòng thử lại.',
    stale:
      'Cấu hình vừa thay đổi ở phiên khác. Dữ liệu mới nhất đã được tải lại.',
    previewError: 'Không thể tính trước giá tại diện tích này.',
  },
  en: {
    title: 'Base Checklist prices',
    description:
      'Configure each checklist base price, standard area, and per-image or per-video fees above the included quantities.',
    name: 'Base Checklist',
    packages: 'Service packages',
    noPackages: 'Not included in a package',
    searchLabel: 'Search checklists',
    searchPlaceholder: 'Checklist or package name',
    packageFilter: 'Filter by package',
    allPackages: 'All packages',
    unassignedPackage: 'Not assigned to a package',
    clearFilters: 'Clear filters',
    resultCount: (visible: number, total: number) =>
      visible + ' of ' + total + ' checklists',
    noResults: 'No matching checklists found.',
    unsavedCount: (count: number) => count + ' unsaved row(s)',
    saveAll: 'Save all changes',
    unsaved: 'Unsaved',
    invalidPriceFor: (name: string) =>
      'Base price for "' + name + '" must be a non-negative whole number.',
    invalidAreaFor: (name: string) =>
      'Standard area for "' + name + '" must be greater than zero.',
    invalidMediaPriceFor: (name: string) =>
      'Extra image/video prices for "' + name + '" must be non-negative whole VND amounts.',
    savedMany: (count: number) =>
      'Saved prices for ' + count + ' checklist(s).',
    savedPartially: (saved: number, total: number) =>
      'Saved ' +
      saved +
      ' of ' +
      total +
      ' checklist(s) before an error occurred.',
    basePrice: 'Base price (VND)',
    standardArea: 'Standard area (ha)',
    extraImagePrice: 'Extra image price (VND/image)',
    extraVideoPrice: 'Extra video price (VND/video)',
    mediaPrices: 'Extra image / video rates',
    imageUnit: 'Image',
    videoUnit: 'Video',
    preview: 'Price at sample area',
    sampleArea: 'Sample order area (ha)',
    sampleAreaHint: (area: string) =>
      'The preview uses this coverage area: ' +
      area +
      '. Extra image/video fees are added from the rates below when requested.',
    invalidSampleArea: 'Enter an area greater than 0 ha.',
    showPreview: 'Preview',
    save: 'Save price',
    active: 'Active',
    inactive: 'Inactive',
    missingArea: 'Standard area is not configured',
    empty: 'No Base Checklists yet.',
    loading: 'Loading price settings…',
    loadError: 'Could not load price settings.',
    invalidArea: 'Enter a standard area greater than 0 ha.',
    invalidPrice: 'Enter a non-negative whole VND amount.',
    invalidMediaPrice: 'Enter non-negative whole VND amounts for extra media.',
    saved: 'Base Checklist price saved.',
    saveError: 'Could not save the price settings. Please try again.',
    stale:
      'These settings changed in another session. The latest values were reloaded.',
    previewError: 'Could not preview the price for this area.',
  },
})
