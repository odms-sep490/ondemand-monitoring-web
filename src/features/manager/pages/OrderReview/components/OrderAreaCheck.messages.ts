import { defineMessages } from '../../../../../shared/i18n'

export const orderAreaCheckMessages = defineMessages({
  vi: {
    title: 'Kiểm tra vùng giám sát',
    intro: 'Kết quả tham khảo, không tự động từ chối đơn.',
    resultTitle: 'Kết quả kiểm tra khu vực',
    checking: 'Đang kiểm tra…',
    recheck: 'Kiểm tra lại',
    missingCoords: 'Đơn chưa có đủ tọa độ hoặc bán kính để kiểm tra vùng.',
    loadFailed: 'Không tải được kết quả kiểm tra vùng. Vui lòng thử lại.',
    analyzing: 'Đang phân tích vùng giám sát…',
  },
  en: {
    title: 'Monitoring area check',
    intro: 'For reference only. This result does not automatically reject the order.',
    resultTitle: 'Area check result',
    checking: 'Checking…',
    recheck: 'Check again',
    missingCoords:
      'The order does not have enough coordinates or radius to check the area.',
    loadFailed: 'Could not load the area check result. Please try again.',
    analyzing: 'Analyzing the monitoring area…',
  },
})
