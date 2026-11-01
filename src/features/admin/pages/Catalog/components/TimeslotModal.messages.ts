import { defineMessages } from '../../../../../shared/i18n'

export const timeslotModalMessages = defineMessages({
  vi: {
    createTitle: 'Thêm khung giờ',
    editTitle: 'Sửa khung giờ',
    createSubtitle: 'Khung giờ ưu tiên khách hàng có thể chọn',
    editSubtitle: 'Cập nhật khung giờ ưu tiên',
    code: 'Mã khung giờ',
    name: 'Tên hiển thị',
    namePlaceholder: 'VD: Buổi sáng',
    startTime: 'Bắt đầu',
    endTime: 'Kết thúc',
    required: 'Bắt buộc',
    nameRequired: 'Bắt buộc nhập cả Tiếng Việt và English',
    nameTooLong: 'Tên song ngữ quá dài. Hãy rút gọn.',
    genericError: 'Không lưu được khung giờ.',
  },
  en: {
    createTitle: 'Add timeslot',
    editTitle: 'Edit timeslot',
    createSubtitle: 'A preferred time window customers can pick',
    editSubtitle: 'Update the preferred timeslot',
    code: 'Timeslot code',
    name: 'Display name',
    namePlaceholder: 'e.g. Morning',
    startTime: 'Start',
    endTime: 'End',
    required: 'Required',
    nameRequired: 'Required in both Vietnamese and English',
    nameTooLong: 'The bilingual name is too long. Please shorten it.',
    genericError: 'Could not save the timeslot.',
  },
})
