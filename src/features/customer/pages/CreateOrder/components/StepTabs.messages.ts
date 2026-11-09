import { defineMessages } from '../../../../../shared/i18n'

export const stepTabsMessages = defineMessages({
  vi: {
    ariaLabel: 'Các bước tạo yêu cầu',
    progress: (step: number, total: number) => `Bước ${step} / ${total}`,
    stepState: {
      complete: 'đã hoàn tất',
      current: 'đang thực hiện',
      upcoming: 'chưa thực hiện',
    },
    shortTitles: {
      1: 'Dịch vụ',
      2: 'Khu vực',
      3: 'Nội dung',
      4: 'Hiện trường',
      5: 'Thời gian',
      6: 'Xác nhận',
    } as Record<1 | 2 | 3 | 4 | 5 | 6, string>,
    subtitles: {
      1: 'Chọn loại giám sát phù hợp',
      2: 'Xác định khu vực cần kiểm tra',
      3: 'Chọn và chỉnh nội dung cần kiểm tra',
      4: 'Bổ sung chi tiết và quyền giám sát',
      5: 'Chọn thời điểm thực hiện',
      6: 'Kiểm tra lại và gửi yêu cầu',
    } as Record<1 | 2 | 3 | 4 | 5 | 6, string>,
  },
  en: {
    ariaLabel: 'Request creation steps',
    progress: (step: number, total: number) => `Step ${step} of ${total}`,
    stepState: {
      complete: 'completed',
      current: 'in progress',
      upcoming: 'not started',
    },
    shortTitles: {
      1: 'Service',
      2: 'Area',
      3: 'Content',
      4: 'Site details',
      5: 'Schedule',
      6: 'Review',
    } as Record<1 | 2 | 3 | 4 | 5 | 6, string>,
    subtitles: {
      1: 'Pick the right monitoring type',
      2: 'Define the area to inspect',
      3: 'Choose and edit what to inspect',
      4: 'Add site details and authorization',
      5: 'Choose when it happens',
      6: 'Review and submit the request',
    } as Record<1 | 2 | 3 | 4 | 5 | 6, string>,
  },
})
