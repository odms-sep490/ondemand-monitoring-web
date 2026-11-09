import { defineMessages } from '../../../../shared/i18n'

export const orderResourceAssignmentWizardMessages = defineMessages({
  vi: {
    returnToPlan: 'Về kế hoạch đơn hàng',
    discardTitle: 'Bỏ thay đổi chưa lưu?',
    discardBody:
      'Phân công đã lưu vẫn được giữ nguyên. Các lựa chọn chưa lưu của nhiệm vụ này sẽ bị bỏ.',
    discardAction: 'Bỏ thay đổi',
    notEligible:
      'Nhiệm vụ chưa đủ điều kiện phân công nguồn lực. Chốt kế hoạch đơn hàng và kiểm tra trạng thái nhiệm vụ trước khi tiếp tục.',
    openPlan: 'Mở kế hoạch đơn hàng',
    reloadStatus: 'Tải lại trạng thái',
    loadFailed:
      'Không thể tải đúng nhiệm vụ để phân công. Vui lòng tải lại dữ liệu.',
    retry: 'Thử lại',
    title: 'Phân công nguồn lực',
    allAssigned: 'Tất cả nhiệm vụ đã được phân công đầy đủ.',
    finishAssigning: 'Hoàn tất phân công',
    hint: 'Chọn đúng nhiệm vụ trước khi phân công nhân sự và thiết bị.',
    next: 'Tiếp theo',
  },
  en: {
    returnToPlan: 'Back to order plan',
    discardTitle: 'Discard unsaved changes?',
    discardBody:
      'Saved assignments are kept. Unsaved selections for this Mission will be discarded.',
    discardAction: 'Discard changes',
    notEligible:
      'This mission is not yet eligible for resource assignment. Finalize the order plan and check the mission status before continuing.',
    openPlan: 'Open order plan',
    reloadStatus: 'Reload status',
    loadFailed:
      'Unable to load the correct mission for assignment. Please reload the data.',
    retry: 'Try again',
    title: 'Resource assignment',
    allAssigned: 'All missions have been fully assigned.',
    finishAssigning: 'Finish assigning',
    hint: 'Select the right mission before assigning staff and devices.',
    next: 'Next',
  },
})
