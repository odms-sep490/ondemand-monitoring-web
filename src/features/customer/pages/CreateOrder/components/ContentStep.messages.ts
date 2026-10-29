import { defineMessages } from '../../../../../shared/i18n'

export const contentStepMessages = defineMessages({
  vi: {
    summaryTitle: 'Tóm tắt yêu cầu',
    editorTitle: 'Danh sách nội dung giám sát',
    service: 'Dịch vụ đã chọn',
    notSelected: 'Chưa chọn',
    selectedCount: 'Nội dung đã chọn',
    totalContent: 'Tổng nội dung giám sát',
    packageContent: 'Nội dung trong gói',
    additionalContent: 'Dịch vụ bổ sung',
    count: (n: number, total: number) => `${n} / ${total}`,
    hint: 'Nội dung giám sát được chốt khi bạn gửi yêu cầu. Bạn có thể quay lại bước trước để đổi dịch vụ.',
    invalid: 'Hãy sửa các nội dung chưa hợp lệ để tiếp tục.',
  },
  en: {
    summaryTitle: 'Request summary',
    editorTitle: 'Monitoring content list',
    service: 'Selected service',
    notSelected: 'Not selected',
    selectedCount: 'Selected content',
    totalContent: 'Total monitoring content',
    packageContent: 'Included in package',
    additionalContent: 'Additional services',
    count: (n: number, total: number) => `${n} / ${total}`,
    hint: 'Monitoring content is locked when you submit the request. Go back to change the service.',
    invalid: 'Fix the invalid items to continue.',
  },
})
