import { defineMessages } from '../../../shared/i18n'

export const journeyMessages = defineMessages({
  vi: {
    title: 'Một yêu cầu, xuyên suốt đến báo cáo',
    stages: {
      request: 'Tạo yêu cầu',
      scope: 'Xác nhận phạm vi',
      inspection: 'Theo dõi kiểm tra',
      report: 'Xem báo cáo',
    },
    illustrative: 'Minh họa quy trình',
    requestTitle: 'Yêu cầu giám sát',
    location: 'Khu vực cần kiểm tra',
    locationValue: 'Khu vực công trình · 04',
    objective: 'Mục tiêu',
    objectiveValue: 'Kiểm tra tình trạng công trình',
    window: 'Thời gian mong muốn',
    windowValue: 'Lịch sẽ được xác nhận',
    summary: 'Tóm tắt yêu cầu',
    scopeTitle: 'Phạm vi đã thống nhất',
    checklist: [
      'Mặt ngoài công trình',
      'Khu vực khó tiếp cận',
      'Ghi nhận hình ảnh và phát hiện',
    ],
    progressTitle: 'Tiến độ yêu cầu',
    update: 'Cập nhật hiện trường',
    updateCopy:
      'Đội kiểm tra đang ghi nhận các khu vực trong phạm vi đã thống nhất.',
    reportTitle: 'Báo cáo kiểm tra',
    reportSummary: 'Tóm tắt kết quả',
    reportCopy:
      'Kết quả và hình ảnh được tổng hợp để bạn xem lại trong dashboard.',
    finding: 'Phát hiện cần lưu ý',
    findingCopy: 'Có một vị trí cần được theo dõi thêm.',
  },
  en: {
    title: 'One request, through to its report',
    stages: {
      request: 'Create request',
      scope: 'Confirm scope',
      inspection: 'Track inspection',
      report: 'Review report',
    },
    illustrative: 'Illustrative walkthrough',
    requestTitle: 'Monitoring request',
    location: 'Inspection area',
    locationValue: 'Site area · 04',
    objective: 'Objective',
    objectiveValue: 'Review the site condition',
    window: 'Preferred time',
    windowValue: 'Schedule to be confirmed',
    summary: 'Request summary',
    scopeTitle: 'Agreed inspection scope',
    checklist: [
      'Building exterior',
      'Hard-to-reach areas',
      'Capture images and findings',
    ],
    progressTitle: 'Request progress',
    update: 'Field update',
    updateCopy:
      'The inspection team is documenting areas within the agreed scope.',
    reportTitle: 'Inspection report',
    reportSummary: 'Result summary',
    reportCopy:
      'Results and images are organized for review in your dashboard.',
    finding: 'Finding to review',
    findingCopy: 'One area may need follow-up.',
  },
})
