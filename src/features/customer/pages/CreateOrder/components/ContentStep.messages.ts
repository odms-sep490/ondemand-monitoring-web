import { defineMessages } from '../../../../../shared/i18n'

export const contentStepMessages = defineMessages({
  vi: {
    summaryTitle: 'Tóm tắt yêu cầu',
    editorTitle: 'Danh sách nội dung giám sát',
    service: 'Dịch vụ đã chọn',
    notSelected: 'Chưa chọn',
    packageContent: 'Trong gói',
    additionalContent: 'Bổ sung',
    count: (n: number, total: number) => `${n} / ${total}`,
    invalid: 'Hãy sửa các nội dung chưa hợp lệ để tiếp tục.',
  },
  en: {
    summaryTitle: 'Request summary',
    editorTitle: 'Monitoring content list',
    service: 'Selected service',
    notSelected: 'Not selected',
    packageContent: 'Included',
    additionalContent: 'Added',
    count: (n: number, total: number) => `${n} / ${total}`,
    invalid: 'Fix the invalid items to continue.',
  },
})
