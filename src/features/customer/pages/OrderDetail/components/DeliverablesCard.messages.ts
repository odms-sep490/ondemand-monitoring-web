import { defineMessages } from '../../../../../shared/i18n'

export const orderDeliverablesMessages = defineMessages({
  vi: {
    title: 'Kết quả bàn giao',
    empty: 'Đơn này chưa có kết quả bàn giao nào.',
    format: 'Định dạng',
    keys: {
      mediaType: 'Loại',
      quantity: 'Số lượng',
      resolution: 'Độ phân giải',
      radiusM: 'Bán kính (m)',
      estimatedAreaHa: 'Diện tích ước tính (ha)',
      additionalRequirements: 'Yêu cầu bổ sung',
      areaFiles: 'Tệp khu vực',
      customerAttachments: 'Tệp đính kèm',
    } as Record<string, string>,
    mediaTypes: { IMAGE: 'Ảnh', VIDEO: 'Video' } as Record<string, string>,
    formats: { IMAGE: 'Ảnh', VIDEO: 'Video' } as Record<string, string>,
  },
  en: {
    title: 'Deliverables',
    empty: 'This order has no deliverables yet.',
    format: 'Format',
    keys: {
      mediaType: 'Type',
      quantity: 'Quantity',
      resolution: 'Resolution',
      radiusM: 'Radius (m)',
      estimatedAreaHa: 'Estimated area (ha)',
      additionalRequirements: 'Additional requirements',
      areaFiles: 'Area files',
      customerAttachments: 'Attachments',
    } as Record<string, string>,
    mediaTypes: { IMAGE: 'Photo', VIDEO: 'Video' } as Record<string, string>,
    formats: { IMAGE: 'Photo', VIDEO: 'Video' } as Record<string, string>,
  },
})
