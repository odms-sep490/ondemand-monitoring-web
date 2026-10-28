import { defineMessages } from '../../../../../shared/i18n'

export const areaDecisionSummaryMessages = defineMessages({
  vi: {
    conflictTitle: 'Cần đối chiếu với bản đồ cấm bay',
    clearTitle: 'Chưa ghi nhận giao vùng cấm bay',
    conflictGuidance:
      'Bản đồ của Bộ Quốc phòng ghi nhận khu vực giao vùng cấm hoặc hạn chế bay. Hãy mở bản đồ, đối chiếu mã vùng bên dưới và xác nhận điều kiện trước khi duyệt.',
    clearGuidance:
      'Bạn có thể tiếp tục xem các điều kiện duyệt khác. Điều kiện bay cuối cùng vẫn cần được xác nhận khi lập kế hoạch.',
  },
  en: {
    conflictTitle: 'Needs checking against the no-fly map',
    clearTitle: 'No intersection with no-fly zones recorded',
    conflictGuidance:
      'The Ministry of Defence map shows this area intersects a no-fly or restricted zone. Open the map, check the zone codes below and confirm the conditions before approving.',
    clearGuidance:
      'You can continue reviewing the other approval criteria. The final flight conditions still need to be confirmed during planning.',
  },
})
