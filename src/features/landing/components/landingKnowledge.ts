/**
 * Knowledge base for the landing-page assistant. Matching is keyword scoring on accent-free text,
 * so "chi phi", "chi phí" and "giá bao nhiêu" all reach the same answer without a backend call.
 * Add a topic by adding an entry: keywords (Vietnamese without accents or English), and answers.
 */
export type Lang = 'vi' | 'en'

export type KnowledgeEntry = {
  id: string
  /** Accent-free, lower-case phrases. Multi-word phrases score higher than single words. */
  keywords: string[]
  answer: Record<Lang, string>
}

/** Lower-cases and removes Vietnamese diacritics so users can type with or without accents. */
export function normalizeVi(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const LANDING_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'greeting',
    keywords: ['xin chao', 'chao ban', 'chao', 'hello', 'hi', 'hey', 'alo', 'helo'],
    answer: {
      vi: 'Xin chào! Mình là trợ lý của OnDemand Monitor. Bạn muốn tìm hiểu về dịch vụ giám sát bằng drone, quy trình 4 bước, chi phí hay cách tạo yêu cầu?',
      en: 'Hi there! I am the OnDemand Monitor assistant. Would you like to know about our drone monitoring services, the 4-step workflow, pricing, or how to create a request?',
    },
  },
  {
    id: 'thanks',
    keywords: ['cam on', 'thank', 'thanks', 'tks', 'thank you', 'cam ơn'],
    answer: {
      vi: 'Rất vui được hỗ trợ bạn! Khi cần, bạn có thể tạo yêu cầu giám sát ngay hoặc hỏi thêm mình bất cứ lúc nào.',
      en: 'Happy to help! You can create a monitoring request anytime or ask me anything else.',
    },
  },
  {
    id: 'bye',
    keywords: ['tam biet', 'bye', 'goodbye', 'hen gap lai', 'see you'],
    answer: {
      vi: 'Tạm biệt bạn! Chúc bạn một ngày tốt lành, hẹn gặp lại trên OnDemand Monitor.',
      en: 'Goodbye! Have a great day, see you again on OnDemand Monitor.',
    },
  },
  {
    id: 'overview',
    keywords: ['gioi thieu', 'he thong', 'la gi', 'tong quan', 'ondemand', 'nen tang', 'overview', 'about', 'what is', 'introduce', 'platform'],
    answer: {
      vi: 'OnDemand Monitor là nền tảng giám sát hiện trường bằng drone theo yêu cầu: bạn khoanh vùng trên bản đồ và mô tả mục tiêu, đội vận hành lập kế hoạch bay, điều phối phi công và drone đạt chuẩn, AI kiểm duyệt chất lượng ảnh, rồi bàn giao báo cáo nghiệm thu minh bạch.',
      en: 'OnDemand Monitor is an on-demand drone inspection platform: pin your site on the map and describe your goal, our team plans the flight and dispatches certified pilots and healthy drones, AI checks image quality, and you receive a transparent handover report.',
    },
  },
  {
    id: 'services',
    keywords: ['dich vu', 'goi', 'loai hinh', 'nha xuong', 'cong trinh', 'giam sat rung', 'khu vuc', 'nong nghiep', 'pin mat troi', 'duong day', 'service', 'services', 'factory', 'construction', 'forest'],
    answer: {
      vi: 'Hệ thống có 4 nhóm dịch vụ chính: Giám sát công trình (theo dõi tiến độ xây dựng), Kiểm tra nhà xưởng (mái, kết cấu, tấm pin), Giám sát khu vực (an ninh, bãi vật liệu, đường dây) và Giám sát rừng (cháy rừng, lấn chiếm). Mỗi dịch vụ có sẵn checklist hạng mục kiểm tra để bạn chọn thêm hoặc bớt.',
      en: 'We offer 4 main services: Construction monitoring, Factory inspection (roofs, structures, solar panels), Area monitoring (security, stockyards, power lines), and Forest monitoring (fire risk, encroachment). Each comes with a ready checklist you can adjust.',
    },
  },
  {
    id: 'workflow',
    keywords: ['quy trinh', 'hoat dong', '4 buoc', 'bon buoc', 'cac buoc', 'cach thuc', 'nhu the nao', 'workflow', 'how it works', 'process', 'steps'],
    answer: {
      vi: 'Quy trình gồm 4 bước: (1) Tạo yêu cầu và khoanh vùng trên bản đồ → (2) Quản lý duyệt phạm vi, gửi báo giá, ký hợp đồng và phân công đội bay → (3) Phi công kiểm tra trước bay, thực hiện nhiệm vụ và kiểm tra sau bay → (4) AI kiểm duyệt ảnh, bạn xem báo cáo, nghiệm thu và tải dữ liệu gốc.',
      en: 'The workflow has 4 steps: (1) Create a request and mark the area → (2) Managers confirm scope, send a quote, sign the contract and assign the crew → (3) Pilots run pre-flight checks, fly and do post-flight checks → (4) AI reviews images, you check the report, accept and download the source media.',
    },
  },
  {
    id: 'create',
    keywords: ['tao yeu cau', 'dat lich', 'dat don', 'tao don', 'yeu cau', 'bat dau', 'su dung', 'order', 'create', 'request', 'book', 'get started', 'submit'],
    answer: {
      vi: 'Bạn bấm “Tạo yêu cầu giám sát” (hoặc đăng nhập), chọn dịch vụ, khoanh vùng trên bản đồ, chọn khung giờ mong muốn và mô tả mục tiêu kiểm tra. Có thể nói chuyện với trợ lý AI bằng giọng nói để điền nhanh. Sau khi gửi, quản lý sẽ duyệt và gửi báo giá cho bạn.',
      en: 'Click “Create monitoring request” (or sign in), pick a service, draw your area on the map, choose a preferred time and describe your goal. You can also talk to the voice assistant to fill it in. Once submitted, a manager reviews it and sends you a quote.',
    },
  },
  {
    id: 'pricing',
    keywords: ['chi phi', 'gia', 'bao nhieu tien', 'bao gia', 'tien', 'phi', 're', 'dat', 'cost', 'price', 'pricing', 'how much', 'quote'],
    answer: {
      vi: 'Chi phí tính theo dịch vụ, diện tích khu vực, các hạng mục checklist và sản phẩm bàn giao bạn chọn. Hệ thống ước tính giá ngay khi bạn tạo yêu cầu, sau đó quản lý gửi báo giá chính thức để bạn chấp nhận trước khi triển khai — không phát sinh chi phí ngoài báo giá đã duyệt.',
      en: 'Pricing depends on the service, area size, checklist items and deliverables you choose. You see an estimate while creating the request, then a manager sends an official quote for you to accept before any flight — nothing is charged beyond the approved quote.',
    },
  },
  {
    id: 'payment',
    keywords: ['thanh toan', 'dat coc', 'coc', 'vnpay', 'payos', 'chuyen khoan', 'hoa don', 'tra tien', 'payment', 'deposit', 'invoice', 'pay'],
    answer: {
      vi: 'Sau khi chấp nhận báo giá và hợp đồng, bạn đặt cọc trực tuyến qua VNPAY hoặc PayOS. Phần còn lại thanh toán theo từng mốc nhiệm vụ. Hóa đơn, lịch sử giao dịch và trạng thái cọc đều hiển thị trong mục “Báo giá & thanh toán” của đơn.',
      en: 'After accepting the quote and contract, you pay a deposit online via VNPAY or PayOS. The rest is paid per mission milestone. Invoices, transactions and deposit status are all in the order’s “Quote & payment” tab.',
    },
  },
  {
    id: 'refund',
    keywords: ['hoan tien', 'hoan coc', 'huy don', 'huy', 'tra lai tien', 'refund', 'cancel', 'cancellation'],
    answer: {
      vi: 'Bạn có thể hủy đơn trước khi triển khai. Tiền cọc được xử lý hoàn theo điều khoản hợp đồng; yêu cầu hoàn và từng lần chuyển khoản đều được ghi nhận và theo dõi minh bạch trong hệ thống.',
      en: 'You can cancel before the mission starts. The deposit is refunded according to the contract terms, and every refund request and transfer is tracked transparently in the system.',
    },
  },
  {
    id: 'weather',
    keywords: ['thoi tiet', 'mua', 'gio', 'bao', 'troi xau', 'hoan bay', 'doi lich', 'weather', 'rain', 'wind', 'reschedule'],
    answer: {
      vi: 'Trước mỗi chuyến bay, hệ thống kiểm tra thời tiết tại khu vực. Nếu không an toàn (mưa, gió mạnh…), nhiệm vụ được dời lịch, liên hệ bạn hoặc hủy theo lựa chọn bạn đã đặt khi tạo yêu cầu — bạn không mất phí cho chuyến bay bị hoãn vì thời tiết.',
      en: 'Weather at your site is checked before every flight. If it is unsafe (rain, strong wind…), the mission is rescheduled, you are contacted, or it is cancelled per the option you chose when ordering — you are not charged for weather delays.',
    },
  },
  {
    id: 'safety',
    keywords: ['an toan', 'bao tri', 'kiem tra truoc bay', 'nguy hiem', 'tai nan', 'drone hong', 'safety', 'maintenance', 'hazard', 'preflight', 'pre flight'],
    answer: {
      vi: 'An toàn là ưu tiên hàng đầu: mỗi drone được kiểm tra 11 hạng mục trước bay (pin, cánh quạt, thân máy, camera, kết nối…) và kiểm tra sau bay. Hệ thống theo dõi giờ bay để tự khóa drone đi bảo trì khi chạm ngưỡng; nếu có hạng mục không đạt, drone được thay ngay và chuyển cho kỹ thuật viên.',
      en: 'Safety comes first: every drone passes an 11-item pre-flight check (battery, propellers, frame, camera, links…) plus a post-flight check. Flight hours are tracked so drones are locked for maintenance at the limit; any failed item triggers an immediate drone swap and a maintenance ticket.',
    },
  },
  {
    id: 'permit',
    keywords: ['giay phep', 'cap phep', 'vung cam bay', 'cam bay', 'phap ly', 'quy dinh', 'permit', 'license', 'no fly', 'legal', 'regulation'],
    answer: {
      vi: 'Đội vận hành kiểm tra vùng bay và lo thủ tục xin phép bay theo quy định trước khi triển khai. Nếu khu vực nằm trong vùng cấm bay, quản lý sẽ thông báo và đề xuất phương án khác cho bạn.',
      en: 'Our operations team checks the airspace and handles flight permits before deployment. If your area is in a no-fly zone, a manager will let you know and suggest alternatives.',
    },
  },
  {
    id: 'team',
    keywords: ['phi cong', 'nhan su', 'doi bay', 'ky thuat vien', 'chung chi', 'ai bay', 'pilot', 'crew', 'staff', 'operator', 'technician'],
    answer: {
      vi: 'Mỗi nhiệm vụ có đội bay riêng gồm phi công, người vận hành, người bảo trì và người kiểm định. Hệ thống theo dõi giờ làm để không phân công người đã làm quá giới hạn trong ngày, đảm bảo đội bay luôn đủ tỉnh táo và an toàn.',
      en: 'Each mission has its own crew: pilot, operator, maintainer and inspector. Working hours are tracked so nobody is assigned beyond their daily limit, keeping the crew alert and safe.',
    },
  },
  {
    id: 'ai',
    keywords: ['ai', 'tri tue nhan tao', 'cong nghe', 'tu dong', 'giong noi', 'nhan dien', 'technology', 'artificial intelligence', 'machine learning', 'smart', 'voice'],
    answer: {
      vi: 'AI có mặt xuyên suốt: trợ lý giọng nói giúp tạo yêu cầu nhanh, AI kiểm duyệt độ nét và chất lượng ảnh, so sánh thay đổi giữa các đợt giám sát, viết bản nháp báo cáo, và theo dõi vòng đời bảo trì drone cùng tải công việc của đội ngũ.',
      en: 'AI runs throughout: a voice assistant speeds up ordering, AI checks image sharpness and quality, compares changes between inspections, drafts reports, and tracks drone maintenance and crew workload.',
    },
  },
  {
    id: 'tracking',
    keywords: ['theo doi', 'tien do', 'trang thai', 'dang o dau', 'bao gio xong', 'thong bao', 'tracking', 'status', 'progress', 'notification', 'realtime'],
    answer: {
      vi: 'Bạn theo dõi từng mốc ngay trên cổng khách hàng: duyệt đơn, báo giá, hợp đồng, đặt cọc, lịch bay, đang bay và bàn giao. Mỗi thay đổi đều có thông báo, và bạn có thể nhắn trao đổi trực tiếp với đội ngũ trong đơn.',
      en: 'Track every milestone in the customer portal: review, quote, contract, deposit, schedule, in flight and handover. Every change sends a notification, and you can message the team directly within the order.',
    },
  },
  {
    id: 'report',
    keywords: ['bao cao', 'ket qua', 'nghiem thu', 'ban giao', 'anh', 'video', 'pdf', 'du lieu', 'report', 'result', 'deliverable', 'photo', 'images'],
    answer: {
      vi: 'Sau nhiệm vụ, bạn nhận báo cáo gồm ảnh/video đã kiểm duyệt, ghi chú hiện trường theo từng hạng mục checklist và bản PDF để lưu trữ. Bạn xem bản xem trước, nghiệm thu, rồi tải toàn bộ dữ liệu gốc độ phân giải cao.',
      en: 'After the mission you get a report with approved photos/videos, field notes per checklist item and a PDF to keep. You review a preview, accept it, then download all high-resolution source media.',
    },
  },
  {
    id: 'revision',
    keywords: ['chua hai long', 'lam lai', 'chinh sua', 'sai', 'khong dat', 'bay lai', 'khieu nai', 'revision', 'redo', 'not satisfied', 'complaint', 'rework'],
    answer: {
      vi: 'Nếu kết quả chưa đạt, bạn bấm “Yêu cầu chỉnh sửa” và chỉ rõ hạng mục kèm lý do. Đội ngũ sẽ xử lý lại hoặc bay bổ sung trong phạm vi đã thỏa thuận, và mọi vòng chỉnh sửa đều được lưu lại.',
      en: 'If results fall short, click “Request revision” and point out the items with a reason. The team reworks them or flies again within the agreed scope, and every revision round is recorded.',
    },
  },
  {
    id: 'feedback',
    keywords: ['danh gia', 'phan hoi', 'gop y', 'review', 'rating', 'feedback'],
    answer: {
      vi: 'Sau khi nghiệm thu, bạn có thể chấm từ 1 đến 5 sao và để lại nhận xét về chất lượng, đúng hẹn và giao tiếp. Đánh giá thấp được chuyển ngay cho quản lý để xử lý.',
      en: 'After accepting the result you can rate 1–5 stars and comment on quality, punctuality and communication. Low ratings go straight to a manager.',
    },
  },
  {
    id: 'recurring',
    keywords: ['dinh ky', 'hang tuan', 'hang thang', 'lap lai', 'thuong xuyen', 'recurring', 'weekly', 'monthly', 'repeat'],
    answer: {
      vi: 'Có hỗ trợ giám sát định kỳ hằng tuần hoặc hằng tháng — rất hợp để theo dõi tiến độ công trình. Bạn chọn tần suất khi tạo yêu cầu, và AI giúp so sánh thay đổi giữa các đợt bay.',
      en: 'Weekly or monthly recurring monitoring is supported — ideal for tracking construction progress. Choose the frequency when ordering, and AI compares changes between runs.',
    },
  },
  {
    id: 'time',
    keywords: ['bao lau', 'mat bao lau', 'thoi gian', 'nhanh khong', 'khi nao', 'may ngay', 'how long', 'turnaround', 'when'],
    answer: {
      vi: 'Thời gian phụ thuộc phạm vi và lịch bay bạn chọn. Thông thường một chuyến bay kéo dài khoảng 30–60 phút, kết quả được kiểm duyệt và bàn giao sau khi hoàn tất nhiệm vụ; mốc thời gian cụ thể nằm trong báo giá.',
      en: 'It depends on scope and your chosen schedule. A flight usually takes about 30–60 minutes, and results are reviewed and delivered after the mission; exact timelines are in your quote.',
    },
  },
  {
    id: 'area',
    keywords: ['khu vuc phuc vu', 'tinh', 'thanh pho', 'o dau', 'pham vi', 'ho chi minh', 'dong nai', 'binh duong', 'ha noi', 'coverage', 'where', 'location', 'city'],
    answer: {
      vi: 'Hiện hệ thống ưu tiên phục vụ khu vực TP. Hồ Chí Minh và các tỉnh lân cận như Đồng Nai, Bình Dương, Long An. Với khu vực xa hơn, bạn cứ tạo yêu cầu để quản lý xem xét và báo lại.',
      en: 'We currently focus on Ho Chi Minh City and nearby provinces such as Dong Nai, Binh Duong and Long An. For farther areas, submit a request and a manager will review it.',
    },
  },
  {
    id: 'security',
    keywords: ['bao mat', 'rieng tu', 'an toan du lieu', 'luu tru', 'xoa du lieu', 'privacy', 'security', 'data protection', 'storage', 'retention'],
    answer: {
      vi: 'Dữ liệu của bạn được lưu trữ riêng tư, chỉ bạn và đội ngũ phụ trách đơn mới xem được. Ảnh gốc chỉ mở khóa sau khi bạn nghiệm thu, và thời hạn lưu trữ được ghi rõ trong đơn.',
      en: 'Your data is stored privately and only you and the assigned team can see it. Original media unlocks only after you accept the result, and the retention period is stated on your order.',
    },
  },
  {
    id: 'account',
    keywords: ['dang ky', 'tai khoan', 'dang nhap', 'mat khau', 'google', 'register', 'sign up', 'login', 'account', 'password'],
    answer: {
      vi: 'Bạn có thể đăng ký bằng email hoặc tiếp tục với Google ở trang đăng nhập. Sau khi có tài khoản, bạn tạo yêu cầu, theo dõi đơn và nhận báo cáo ngay trên cổng khách hàng.',
      en: 'Sign up with email or continue with Google on the login page. With an account you can create requests, track orders and receive reports in the customer portal.',
    },
  },
  {
    id: 'support',
    keywords: ['ho tro', 'lien he', 'tu van', 'hotline', 'nhan vien', 'nguoi that', 'support', 'contact', 'help', 'human', 'agent'],
    answer: {
      vi: 'Bạn có thể gửi yêu cầu hỗ trợ trong Trung tâm hỗ trợ sau khi đăng nhập, hoặc nhắn trực tiếp với đội ngũ trong từng đơn. Nhân viên hỗ trợ sẽ phản hồi bạn sớm nhất.',
      en: 'After signing in, open a ticket in the Support Center or message the team directly within any order. A support agent will reply as soon as possible.',
    },
  },
]

/** Replies for rude, nonsense or too-short input, so the bot answers politely instead of "no match". */
const OFF_TOPIC: Record<'rude' | 'short', Record<Lang, string>> = {
  rude: {
    vi: 'Mình luôn sẵn lòng hỗ trợ bạn 😊. Bạn có thể hỏi về dịch vụ giám sát bằng drone, chi phí, quy trình 4 bước hoặc cách tạo yêu cầu nhé.',
    en: 'I am always happy to help 😊. Ask me about drone monitoring services, pricing, the 4-step workflow, or how to create a request.',
  },
  short: {
    vi: 'Bạn có thể nói rõ hơn một chút không? Ví dụ: “Chi phí thế nào?”, “Quy trình ra sao?” hay “Có giám sát định kỳ không?”.',
    en: 'Could you tell me a bit more? For example: “How much does it cost?”, “How does it work?” or “Do you offer recurring monitoring?”.',
  },
}

const RUDE_WORDS = ['cc', 'dm', 'dcm', 'vl', 'vcl', 'clgt', 'cl', 'dit', 'lon', 'ngu', 'fuck', 'shit', 'wtf']

function containsPhrase(haystack: string, phrase: string): boolean {
  return ` ${haystack} `.includes(` ${phrase} `)
}

/**
 * Topics that also exist in the original 8 regex answers, which have pre-recorded audio.
 * The widget keeps those answers (and their audio) for these ids.
 */
export const CORE_TOPIC_IDS = new Set(['overview', 'workflow', 'ai', 'pricing', 'tracking', 'report', 'safety', 'create'])

/** Best matching knowledge entry id and answer, or null when nothing fits. */
export function matchLandingEntry(text: string, lang: Lang): { id: string; answer: string } | null {
  const normalized = normalizeVi(text)
  if (!normalized) return { id: 'short', answer: OFF_TOPIC.short[lang] }
  let best: { entry: KnowledgeEntry; score: number } | null = null
  for (const entry of LANDING_KNOWLEDGE) {
    let score = 0
    for (const keyword of entry.keywords) {
      const phrase = normalizeVi(keyword)
      if (phrase && containsPhrase(normalized, phrase)) {
        score += phrase.includes(' ') ? 3 : phrase.length >= 4 ? 2 : 1
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { entry, score }
  }
  if (best) return { id: best.entry.id, answer: best.entry.answer[lang] }
  const words = normalized.split(' ')
  if (words.some((w) => RUDE_WORDS.includes(w))) return { id: 'rude', answer: OFF_TOPIC.rude[lang] }
  if (normalized.replace(/\s/g, '').length <= 3) return { id: 'short', answer: OFF_TOPIC.short[lang] }
  return null
}

/** Best matching answer, or null when nothing in the knowledge base fits. */
export function matchLandingAnswer(text: string, lang: Lang): string | null {
  const normalized = normalizeVi(text)
  if (!normalized) return OFF_TOPIC.short[lang]
  const words = normalized.split(' ')

  let best: { entry: KnowledgeEntry; score: number } | null = null
  for (const entry of LANDING_KNOWLEDGE) {
    let score = 0
    for (const keyword of entry.keywords) {
      const phrase = normalizeVi(keyword)
      if (phrase && containsPhrase(normalized, phrase)) {
        // Longer, more specific phrases outweigh generic single words like "gia" or "ai".
        score += phrase.includes(' ') ? 3 : phrase.length >= 4 ? 2 : 1
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { entry, score }
  }
  if (best) return best.entry.answer[lang]

  if (words.some((w) => RUDE_WORDS.includes(w))) return OFF_TOPIC.rude[lang]
  if (normalized.replace(/\s/g, '').length <= 3) return OFF_TOPIC.short[lang]
  return null
}
