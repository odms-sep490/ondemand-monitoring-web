import { defineMessages } from '../../../../shared/i18n'

export const commonMiscMessages = defineMessages({
  vi: {
    noCheckItems: 'Chưa có hạng mục kiểm tra.',
    chooseOtherMission: 'Chọn nhiệm vụ khác',
    missingPrefix: 'Còn thiếu:',
    useForEmptyRoles: 'Dùng người này cho các vai trò còn trống',
    assignedDevice: 'Thiết bị đã phân công',
    finishPermit: 'Hoàn tất giấy phép bay',
    nextPermit: 'Tiếp: Giấy phép bay',
    resourcesLoadFailed:
      'Không thể tải nguồn lực của nhiệm vụ này. Vui lòng thử lại.',
    missionNotEligible:
      'Nhiệm vụ không còn đủ điều kiện phân công trong đơn hàng này. Vui lòng chọn lại nhiệm vụ.',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    ready: 'Sẵn sàng',
  },
  en: {
    noCheckItems: 'No check items yet.',
    chooseOtherMission: 'Choose another mission',
    missingPrefix: 'Missing:',
    useForEmptyRoles: 'Use this person for the remaining empty roles',
    assignedDevice: 'Assigned device',
    finishPermit: 'Finish flight permit',
    nextPermit: 'Next: Flight permit',
    resourcesLoadFailed:
      'Unable to load resources for this mission. Please try again.',
    missionNotEligible:
      'The mission is no longer eligible for assignment in this order. Please choose a mission again.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    ready: 'Ready',
  },
})
