import { defineMessages } from '../../../../shared/i18n'

export const areaHelpersMessages = defineMessages({
  vi: {
    options: {
      notRequired: {
        label: 'Khu vực phù hợp sơ bộ',
        hint: 'Có thể tiếp tục duyệt đơn và phân nguồn lực. Hồ sơ xin phép bay được thực hiện ở bước sau.',
      },
      changeLocation: {
        label: 'Yêu cầu khách đổi khu vực',
        hint: 'Trả đơn về cho khách chọn lại vị trí giám sát.',
      },
      rejected: {
        label: 'Khu vực không khả thi',
        hint: 'Khu vực hiện tại không thể triển khai theo yêu cầu.',
      },
    },
    unsuitableReasons: [
      'Khu vực cấm/hạn chế không đáp ứng điều kiện',
      'Không thể bảo đảm phạm vi hoạt động',
      'Không thể xác minh điều kiện khu vực',
      'Lý do khác',
    ],
    reviewLabels: {
      NOT_REVIEWED: 'Chưa đánh giá',
      NOT_REQUIRED: 'Khu vực phù hợp sơ bộ',
      PENDING_PERMIT: 'Chờ xử lý giấy phép',
      APPROVED: 'Khu vực đã được xác nhận',
      REJECTED: 'Khu vực không khả thi',
    },
    confirm: {
      needInfoTitle: 'Yêu cầu khách đổi khu vực?',
      rejectTitle: 'Từ chối đơn hàng?',
      needInfoBody:
        'Đơn sẽ được chuyển về cho khách để chọn lại khu vực giám sát. Bạn nên gọi báo trước cho khách.',
      rejectBody:
        'Đơn sẽ bị từ chối và đóng lại. Bạn nên gọi báo cho khách trước khi từ chối.',
      needInfoAction: 'Yêu cầu đổi khu vực',
      rejectAction: 'Từ chối đơn',
    },
  },
  en: {
    options: {
      notRequired: {
        label: 'Area preliminarily suitable',
        hint: 'You can continue reviewing the order and assigning resources. The flight permit application is handled in a later step.',
      },
      changeLocation: {
        label: 'Ask the customer to change the area',
        hint: 'Send the order back to the customer to pick a new monitoring location.',
      },
      rejected: {
        label: 'Area not feasible',
        hint: 'The current area cannot be served as requested.',
      },
    },
    unsuitableReasons: [
      'Restricted/prohibited area does not meet requirements',
      'Cannot guarantee the operating range',
      'Cannot verify the area conditions',
      'Other reason',
    ],
    reviewLabels: {
      NOT_REVIEWED: 'Not assessed',
      NOT_REQUIRED: 'Area preliminarily suitable',
      PENDING_PERMIT: 'Permit pending',
      APPROVED: 'Area confirmed',
      REJECTED: 'Area not feasible',
    },
    confirm: {
      needInfoTitle: 'Ask the customer to change the area?',
      rejectTitle: 'Reject this order?',
      needInfoBody:
        'The order will be sent back to the customer to pick a new monitoring area. You should call the customer beforehand.',
      rejectBody:
        'The order will be rejected and closed. You should call the customer before rejecting.',
      needInfoAction: 'Request area change',
      rejectAction: 'Reject order',
    },
  },
})
