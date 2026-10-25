import { defineMessages } from '../../shared/i18n'

// Every customer-facing string is paired here. Keep IDs and visual data out of
// localized copy so changing languages never changes request/ticket identity.
export const landingMessages = defineMessages({
  vi: {
    brandName: 'OnDemand Monitor',
    navLinks: [
      { label: 'Quy trình', href: '#how-it-works' },
      { label: 'Kết quả', href: '#results' },
      { label: 'Ứng dụng', href: '#industries' },
      { label: 'Câu hỏi thường gặp', href: '#faq' },
    ],
    heroChip: 'GIÁM SÁT HIỆN TRƯỜNG THEO YÊU CẦU',
    heroTitleLines: ['Kiểm tra an toàn hơn.', 'Nắm rõ mọi kết quả.'],
    heroLede:
      'Gửi yêu cầu giám sát hiện trường, theo dõi tiến độ và nhận báo cáo kiểm tra trên cùng một hệ thống. Giảm nhu cầu tiếp cận trực tiếp những khu vực khó hoặc nguy hiểm.',
    workflowSection: {
      eyebrow: 'Quy trình rõ ràng',
      title: 'Từ yêu cầu đến báo cáo, trên cùng một hệ thống',
      copy: 'Bạn luôn biết yêu cầu đang ở bước nào và kết quả được lưu ở đâu.',
    },
    workflowSteps: [
      {
        no: '01',
        title: 'Tạo yêu cầu',
        detail:
          'Mô tả khu vực, mục tiêu, thời gian mong muốn và nội dung cần kiểm tra.',
      },
      {
        no: '02',
        title: 'Xác nhận phạm vi',
        detail:
          'Đội ngũ tiếp nhận rà soát thông tin và thống nhất kế hoạch phù hợp.',
      },
      {
        no: '03',
        title: 'Theo dõi ticket',
        detail:
          'Cập nhật tiến độ, trao đổi và thông tin cần bổ sung ngay trong ticket.',
      },
      {
        no: '04',
        title: 'Xem báo cáo',
        detail:
          'Nhận kết quả, hình ảnh và các phát hiện trong dashboard của bạn.',
      },
    ],
    featureSection: {
      eyebrow: 'Theo dõi minh bạch',
      title: 'Mỗi yêu cầu có một ticket xuyên suốt',
      copy: 'Không phải gọi hỏi từng bước. Trạng thái, trao đổi và cập nhật tiến độ được tập trung để khách hàng và đội xử lý cùng nắm thông tin.',
    },
    industriesSection: {
      eyebrow: 'Ứng dụng',
      title: 'Hỗ trợ kiểm tra nhiều loại hiện trường',
      mediaNotice: 'Ảnh minh họa bối cảnh sử dụng dịch vụ.',
      copy: 'Từ hạ tầng đến công trình, quy trình được tổ chức theo nhu cầu thực tế của từng khu vực.',
    },
    industries: [
      {
        title: 'Công trình xây dựng',
        detail: 'Theo dõi hiện trạng, tiến độ và các khu vực cần kiểm tra.',
        location: 'Kiểm tra công trình',
      },
      {
        title: 'Hạ tầng và tiện ích',
        detail:
          'Hỗ trợ đánh giá các vị trí khó tiếp cận hoặc cần hạn chế rủi ro.',
        location: 'Kiểm tra hạ tầng',
      },
      {
        title: 'Khu vực rộng và từ xa',
        detail:
          'Thu thập thông tin hiện trường mà không cần bắt đầu bằng việc tiếp cận trực tiếp.',
        location: 'Giám sát từ xa',
      },
    ],
    faqSection: {
      eyebrow: 'Câu hỏi thường gặp',
      title: 'Thông tin bạn cần biết',
      copy: 'Cần hỗ trợ thêm? Liên hệ support@odms.vn.',
    },
    faqItems: [
      {
        question: 'Tôi cần cung cấp gì khi tạo yêu cầu?',
        answer:
          'Hãy cung cấp vị trí hoặc khu vực, mục tiêu kiểm tra, thời gian mong muốn và các lưu ý an toàn nếu có. Đội ngũ sẽ trao đổi để làm rõ phạm vi.',
      },
      {
        question: 'Tôi theo dõi tiến độ ở đâu?',
        answer:
          'Mỗi yêu cầu có ticket riêng để xem trạng thái và trao đổi. Các yêu cầu và báo cáo đã hoàn tất cũng được tập trung trên dashboard.',
      },
      {
        question: 'Kết quả kiểm tra gồm những gì?',
        answer:
          'Tùy phạm vi đã thống nhất, báo cáo có thể gồm tóm tắt, hình ảnh, các phát hiện và ghi chú liên quan.',
      },
      {
        question: 'Có phải mọi lần kiểm tra đều dùng drone?',
        answer:
          'Không. Drone là một phương tiện hỗ trợ khi phù hợp với điều kiện và kế hoạch. Phương thức kiểm tra được xác định theo yêu cầu và đánh giá của đội ngũ.',
      },
    ],
    ctaSection: {
      eyebrow: 'Bắt đầu từ khu vực bạn cần kiểm tra',
      title: 'Tạo yêu cầu và theo dõi toàn bộ tiến độ tại một nơi.',
    },
    footerDescription:
      'Giám sát và kiểm tra hiện trường theo yêu cầu. Thành phố Hồ Chí Minh, Việt Nam.',
    footerGroups: [
      {
        title: 'Dịch vụ',
        links: ['Tạo yêu cầu', 'Theo dõi ticket', 'Báo cáo kết quả'],
      },
      { title: 'Ứng dụng', links: ['Công trình', 'Hạ tầng', 'Khu vực từ xa'] },
      {
        title: 'Hỗ trợ',
        links: ['Câu hỏi thường gặp', 'support@odms.vn', 'An toàn kiểm tra'],
      },
    ],
    footerCopyright: '© 2026 OnDemand Monitor. Đồ án FA26SE039.',
    footerLegal: 'Điều khoản sử dụng · Quyền riêng tư',
  },
  en: {
    brandName: 'OnDemand Monitor',
    navLinks: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Results', href: '#results' },
      { label: 'Use cases', href: '#industries' },
      { label: 'FAQ', href: '#faq' },
    ],
    heroChip: 'ON-DEMAND SITE MONITORING',
    heroTitleLines: ['Inspect more safely.', 'Know every outcome.'],
    heroLede:
      'Request site monitoring, track progress, and review inspection reports in one system. Reduce the need to enter hard-to-reach or hazardous areas in person.',
    workflowSection: {
      eyebrow: 'A clear process',
      title: 'From request to report, in one system',
      copy: 'Always know where your request stands and where to find its results.',
    },
    workflowSteps: [
      {
        no: '01',
        title: 'Create a request',
        detail:
          'Describe the site, inspection goal, preferred timing, and what needs to be checked.',
      },
      {
        no: '02',
        title: 'Confirm the scope',
        detail:
          'Our team reviews the details and agrees on a suitable inspection plan.',
      },
      {
        no: '03',
        title: 'Track the ticket',
        detail:
          'Follow updates, discuss details, and share requested information in the ticket.',
      },
      {
        no: '04',
        title: 'Review the report',
        detail: 'Find results, images, and observations in your dashboard.',
      },
    ],
    featureSection: {
      eyebrow: 'Transparent tracking',
      title: 'One ticket follows every request',
      copy: 'No need to call for every update. Status, discussion, and progress stay together so customers and the operations team share the same context.',
    },
    industriesSection: {
      eyebrow: 'Use cases',
      title: 'Support for a range of inspection sites',
      mediaNotice: 'Stock imagery illustrating service use cases.',
      copy: 'From infrastructure to construction, the process is organized around the needs of each site.',
    },
    industries: [
      {
        title: 'Construction sites',
        detail:
          'Monitor site conditions, progress, and areas that need inspection.',
        location: 'Site inspection',
      },
      {
        title: 'Infrastructure and utilities',
        detail:
          'Assess hard-to-reach locations or areas where exposure should be limited.',
        location: 'Infrastructure inspection',
      },
      {
        title: 'Large and remote areas',
        detail:
          'Gather site information without making direct access the first step.',
        location: 'Remote monitoring',
      },
    ],
    faqSection: {
      eyebrow: 'Frequently asked questions',
      title: 'What you need to know',
      copy: 'Need more help? Contact support@odms.vn.',
    },
    faqItems: [
      {
        question: 'What should I include in a request?',
        answer:
          'Share the location or area, inspection objective, preferred timing, and any safety considerations. Our team will follow up to clarify the scope.',
      },
      {
        question: 'Where can I track progress?',
        answer:
          'Each request has its own ticket for status updates and discussion. Completed requests and reports are also collected in your dashboard.',
      },
      {
        question: 'What is included in an inspection result?',
        answer:
          'Depending on the agreed scope, a report may include a summary, images, findings, and relevant notes.',
      },
      {
        question: 'Does every inspection use a drone?',
        answer:
          'No. A drone is one supporting tool when it suits the conditions and plan. The inspection method is determined based on the request and the operations team’s assessment.',
      },
    ],
    ctaSection: {
      eyebrow: 'Start with the site you need inspected',
      title: 'Create a request and follow its progress in one place.',
    },
    footerDescription:
      'On-demand site monitoring and inspection. Ho Chi Minh City, Vietnam.',
    footerGroups: [
      {
        title: 'Service',
        links: ['Create a request', 'Track a ticket', 'Inspection reports'],
      },
      {
        title: 'Use cases',
        links: ['Construction', 'Infrastructure', 'Remote sites'],
      },
      {
        title: 'Support',
        links: ['FAQ', 'support@odms.vn', 'Inspection safety'],
      },
    ],
    footerCopyright: '© 2026 OnDemand Monitor. Capstone project FA26SE039.',
    footerLegal: 'Terms of use · Privacy',
  },
})
