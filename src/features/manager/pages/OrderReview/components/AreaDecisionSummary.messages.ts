import { defineMessages } from '../../../../../shared/i18n'

export const areaDecisionSummaryMessages = defineMessages({
  vi: {
    conflictTitle: 'Cần đối chiếu vùng cấm bay',
    clearTitle: 'Không giao với vùng cấm bay',
    conflictGuidance:
      'Khu vực có phần giao với vùng cấm hoặc hạn chế bay. Đối chiếu mã vùng trước khi duyệt.',
    clearGuidance:
      'Xác nhận điều kiện bay khi lập kế hoạch.',
  },
  en: {
    conflictTitle: 'Check the restricted flight zone',
    clearTitle: 'No restricted-zone overlap found',
    conflictGuidance:
      'This area intersects a no-fly or restricted zone. Check the zone codes on the map before approval.',
    clearGuidance:
      'Confirm flight conditions during planning.',
  },
})
