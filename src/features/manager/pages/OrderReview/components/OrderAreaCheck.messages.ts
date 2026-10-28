import { defineMessages } from '../../../../../shared/i18n'

export const orderAreaCheckMessages = defineMessages({
  vi: {
    title: 'Kiểm tra vùng giám sát',
    intro:
      'Giúp xác định khu vực có cần kiểm tra thêm trước khi duyệt đơn hay không. Kết quả này chỉ là cảnh báo sơ bộ, không tự động từ chối đơn.',
    resultTitle: 'Kết quả kiểm tra khu vực',
    checking: 'Đang kiểm tra…',
    recheck: 'Kiểm tra lại',
    missingCoords: 'Đơn chưa có đủ tọa độ hoặc bán kính để kiểm tra vùng.',
    loadFailed: 'Không tải được kết quả kiểm tra vùng. Vui lòng thử lại.',
    analyzing: 'Đang phân tích vùng giám sát…',
  },
  en: {
    title: 'Monitoring area check',
    intro:
      'Helps determine whether the area needs further checks before the order is approved. This result is only a preliminary warning and does not automatically reject the order.',
    resultTitle: 'Area check result',
    checking: 'Checking…',
    recheck: 'Check again',
    missingCoords:
      'The order does not have enough coordinates or radius to check the area.',
    loadFailed: 'Could not load the area check result. Please try again.',
    analyzing: 'Analyzing the monitoring area…',
  },
})
