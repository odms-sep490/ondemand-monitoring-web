import type { HelpContent } from './helpArticles'

/** Vietnamese help center copy. Keep the shape in sync with helpArticles.en.ts. */
export const helpContentVi: HelpContent = {
  topics: {
    ORDERS: {
      title: 'Đơn hàng',
      description:
        'Quản lý yêu cầu giám sát, trạng thái phê duyệt và phạm vi giám sát',
    },
    MISSIONS: {
      title: 'Nhiệm vụ bay',
      description:
        'Lên lịch bay, phân công drone, kiểm tra trước khi bay và thực thi nhiệm vụ',
    },
    RESULTS: {
      title: 'Kết quả giám sát',
      description:
        'Ảnh độ phân giải cao, bản đồ nhiệt, báo cáo video và các tùy chọn tải xuống',
    },
    MEDIA: {
      title: 'Media & Phát trực tiếp',
      description:
        'Luồng dữ liệu telemetry thời gian thực, camera và phát lại video',
    },
    SCHEDULING: {
      title: 'Lên lịch bay',
      description:
        'Đổi lịch bay, hủy chuyến và trạng thái khả dụng của người vận hành',
    },
    ACCOUNT: {
      title: 'Tài khoản & Quyền truy cập',
      description:
        'Cập nhật hồ sơ, thông báo, phân quyền tổ chức và truy cập API',
    },
  },
  articles: {
    'ord-1': {
      question: 'Tại sao yêu cầu giám sát của tôi vẫn đang chờ phê duyệt?',
      answer:
        'Yêu cầu giám sát sẽ ở trạng thái CHỜ PHÊ DUYỆT trong khi quản lý vận hành xác minh vùng không phận, dự báo thời tiết và phân công thiết bị drone phù hợp cùng phi công được chứng nhận. Quá trình phê duyệt thường hoàn tất trong vòng 15–30 phút trong giờ làm việc.',
      keywords: ['chờ', 'phê duyệt', 'đang xử lý', 'tại sao', 'trễ', 'yêu cầu', 'trạng thái', 'pending'],
    },
    'ord-2': {
      question: 'Tại sao yêu cầu giám sát của tôi bị từ chối?',
      answer:
        'Yêu cầu có thể bị từ chối do vùng không phận bị hạn chế tạm thời (NOTAM), cảnh báo thời tiết xấu hoặc tọa độ GPS không hợp lệ. Bạn sẽ nhận được thông báo chính thức với lý do từ chối cụ thể cùng hướng dẫn điều chỉnh và gửi lại.',
      keywords: ['từ chối', 'bị hủy', 'không phận', 'thời tiết', 'tại sao', 'rejected'],
    },
    'ord-3': {
      question: 'Tôi có thể thay đổi lịch giám sát sau khi đã gửi không?',
      answer:
        'Có, bạn có thể yêu cầu thay đổi lịch bay tối đa 2 giờ trước thời điểm bay đã định. Hãy vào trang Chi tiết đơn hàng và chọn "Thay đổi lịch bay". Nếu nhiệm vụ đã ở trạng thái TIỀN KIỂM hoặc ĐANG BAY, vui lòng liên hệ Bộ phận hỗ trợ trực tiếp.',
      keywords: ['thay đổi', 'sửa', 'lịch bay', 'đổi lịch', 'thời gian', 'ngày'],
    },
    'ord-4': {
      question: 'Tôi có thể hủy yêu cầu giám sát không?',
      answer:
        'Bạn có thể hủy yêu cầu ở trạng thái CHỜ PHÊ DUYỆT hoặc ĐÃ DUYỆT mà không bị phạt. Khi nhiệm vụ đã ở ĐANG BAY, việc hủy phải tuân theo quy trình an toàn bay.',
      keywords: ['hủy', 'dừng', 'hủy bỏ', 'cancel', 'xóa'],
    },
    'msn-1': {
      question: 'Tại sao nhiệm vụ drone của tôi chưa bắt đầu?',
      answer:
        'Nhiệm vụ sẽ bắt đầu đúng khung giờ đã lên lịch sau khi qua kiểm tra tự động tiền chuyến bay 100%. Nếu drone đang thực hiện hiệu chỉnh pin hoặc chờ khóa telemetry, việc khởi hành có thể bị trễ 2–5 phút.',
      keywords: ['chưa bắt đầu', 'trễ', 'khởi động', 'bay', 'nhiệm vụ', 'chờ', 'mission'],
    },
    'msn-2': {
      question: 'Tại sao drone được phân công của tôi bị thay thế?',
      answer:
        'Hệ thống quản lý đội bay tự động thay thế drone nếu telemetry tiền chuyến phát hiện mất cân bằng pin, sai lệch nhiệt động cơ, hoặc cảnh báo hiệu chỉnh cảm biến. Drone dự phòng được phân công ngay lập tức để đảm bảo nhiệm vụ không thất bại.',
      keywords: ['thay drone', 'đổi drone', 'drone khác', 'thay thế', 'hardware', 'tiền kiểm'],
    },
    'msn-3': {
      question: 'Điều gì xảy ra nếu nhiệm vụ không qua kiểm tra tiền chuyến?',
      answer:
        'Khi kiểm tra trước bay không đạt (FAILED_PREFLIGHT), thiết bị bị ảnh hưởng sẽ tự động được đưa vào bảo trì. Người vận hành hệ thống sẽ phân công thiết bị khả dụng khác trong vòng 10 phút hoặc lên lịch lại chuyến bay mà không tính thêm chi phí.',
      keywords: ['kiểm tra trước bay không đạt', 'lỗi kiểm tra', 'bảo trì', 'thất bại'],
    },
    'msn-4': {
      question: 'Tại sao người vận hành dừng hoặc đổi lịch chuyến bay của tôi?',
      answer:
        'Người vận hành hệ thống có thể tạm dừng hoặc dừng chuyến bay khi gió giật vượt ngưỡng an toàn (>12 m/s), tầm nhìn hạn chế, hoặc hạn chế không phận khẩn cấp. An toàn luôn là ưu tiên hàng đầu.',
      keywords: ['dừng', 'tạm dừng', 'đổi lịch', 'gió', 'vận hành viên', 'thời tiết'],
    },
    'res-1': {
      question: 'Tôi xem và tải kết quả giám sát ở đâu?',
      answer:
        'Khi xử lý telemetry sau bay hoàn tất, hãy vào Chi tiết đơn hàng → Tab Kết quả giám sát. Bạn có thể xem ảnh orthomosaic 4K, bản đồ nhiệt và tải xuống gói GeoTIFF / ZIP độ phân giải cao trực tiếp.',
      keywords: ['xem', 'tải xuống', 'kết quả', 'ảnh', 'hình ảnh', 'báo cáo', 'download'],
    },
    'res-2': {
      question: 'Tại sao kết quả của tôi vẫn đang xử lý hoặc thiếu video?',
      answer:
        'Media sau bay trải qua quá trình ghép ảnh AI tự động và kiểm soát chất lượng. Render video 4K và lập bản đồ nhiệt thường hoàn tất trong vòng 15–20 phút sau khi hạ cánh.',
      keywords: ['đang xử lý', 'thiếu', 'video', 'ghép ảnh', 'chờ', 'tải'],
    },
    'res-3': {
      question: 'Dữ liệu giám sát được lưu trữ trên đám mây bao lâu?',
      answer:
        'Mặc định, video thô được lưu 90 ngày và ảnh orthomosaic đã xử lý được lưu 365 ngày. Bạn có thể mở rộng thời gian lưu trữ vô thời hạn trong Cài đặt tài khoản.',
      keywords: ['lưu trữ', 'bao lâu', 'hết hạn', 'đám mây', 'thời gian'],
    },
    'res-4': {
      question: 'Tại sao kết quả giám sát của tôi không đầy đủ?',
      answer:
        'Nếu drone quay về sớm do pin yếu hoặc thời tiết xấu, kết quả sẽ chỉ bao gồm một phần khu vực giám sát. Hệ thống sẽ tự động lên lịch nhiệm vụ bổ sung cho khu vực còn lại.',
      keywords: ['không đầy đủ', 'thiếu', 'vùng phủ', 'bị cắt ngắn', 'một phần'],
    },
    'med-1': {
      question: 'Tại sao livestream không khả dụng trong khi bay?',
      answer:
        'Phát trực tiếp yêu cầu kết nối telemetry 5G/LTE đang hoạt động. Tại các hành lang bay xa có tín hiệu di động yếu, livestream sẽ chuyển sang chế độ ghi đệm. Video HD đầy đủ sẽ tự động tải lên sau khi hạ cánh.',
      keywords: ['livestream', 'trực tiếp', 'không có', 'màn hình đen', '5g', 'telemetry'],
    },
    'med-2': {
      question: 'Tại sao video upload bị thất bại?',
      answer:
        'Video tự động thử lại tải lên tối đa 3 lần qua Wi-Fi trạm mặt đất. Nếu kết nối mạng bị gián đoạn, hãy bấm "Thử lại tải lên" trên màn hình Quản lý Media.',
      keywords: ['upload lỗi', 'tải lên thất bại', 'video lỗi', 'thử lại'],
    },
    'med-3': {
      question: 'Làm thế nào để chia sẻ livestream với nhóm hiện trường?',
      answer:
        'Trong trình phát livestream, bấm "Chia sẻ liên kết phát". Bạn có thể tạo URL tạm thời an toàn kèm tùy chọn mã bảo vệ cho các bên liên quan tại hiện trường.',
      keywords: ['chia sẻ', 'link phát', 'truy cập', 'nhóm', 'mời'],
    },
    'sch-1': {
      question: 'Khung giờ bay hoạt động là khi nào?',
      answer:
        'Hoạt động bay tiêu chuẩn diễn ra hàng ngày từ 06:00 đến 18:00 (trong giờ ban ngày). Giám sát ban đêm yêu cầu chứng nhận nhiệt đặc biệt và đặt lịch trước với điều phối viên.',
      keywords: ['giờ bay', 'khung giờ', 'ban đêm', 'lịch bay', 'khi nào'],
    },
    'acc-1': {
      question: 'Làm thế nào để thêm thành viên vào tổ chức của tôi?',
      answer:
        'Vào Cài đặt tổ chức → Thành viên nhóm và bấm "Mời thành viên". Phân quyền vai trò như Người xem, Quản lý hoặc Quản trị viên thanh toán.',
      keywords: ['mời', 'nhóm', 'thành viên', 'người dùng', 'vai trò', 'quyền'],
    },
  },
}
