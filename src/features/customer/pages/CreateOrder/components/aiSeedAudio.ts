/**
 * Maps fixed consultation prompts across the entire Create Order flow to pre-generated
 * ZeroTTS (Mai Chi) WAV files under /assets/ai/audio/ for 0ms, gapless, 100% reliable playback.
 */

function normalizeSpeechKey(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('anh/chị', 'anh chị')
    .replaceAll('“', '')
    .replaceAll('”', '')
    .replaceAll('"', '')
    .replace(/[.,!?;:–—-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const EXACT_SEED_ENTRIES: Array<[string, string]> = [
  [
    'Chọn mục đích chuyến bay trong biểu mẫu bên dưới. Nếu không có mục phù hợp, chọn “Mục đích khác” rồi nhập mục đích cụ thể. Sau đó bấm Xác nhận mục đích.',
    '/assets/ai/audio/step1_purpose.wav',
  ],
  [
    'Anh/chị nhập khu vực cần giám sát và việc muốn thực hiện nhé. Em sẽ đọc mô tả rồi hỏi thêm từng ý để làm rõ nhiệm vụ.',
    '/assets/ai/audio/step1_description.wav',
  ],
  [
    'Em đã ghi nhận mục đích chuyến bay. Anh/chị mô tả khu vực cần giám sát và những gì muốn ghi nhận trong biểu mẫu bên dưới nhé.',
    '/assets/ai/audio/step1_description_ack.wav',
  ],
  [
    'Chọn dịch vụ và mục đích chuyến bay phù hợp. Mô tả việc cần làm, khu vực và vị trí cần chú ý.',
    '/assets/ai/audio/step1_guidance.wav',
  ],
  [
    'Chọn vị trí trên bản đồ, khoanh vùng cần giám sát rồi bấm Xác nhận và tiếp tục.',
    '/assets/ai/audio/step2_reply.wav',
  ],
  [
    'Tìm địa chỉ hoặc chọn điểm trên bản đồ. Khoanh vùng bằng hình chữ nhật, hình tròn hoặc tự vẽ. Kiểm tra đúng vị trí và xác nhận để tiếp tục.',
    '/assets/ai/audio/step2_guidance.wav',
  ],
  [
    'Chọn các hạng mục cần thực hiện, kiểm tra số ảnh và video rồi bấm Xác nhận và tiếp tục.',
    '/assets/ai/audio/step3_reply.wav',
  ],
  [
    'Chọn từng công việc cần làm. Mở chi tiết, kiểm tra số ảnh và video, xem lại chi phí rồi xác nhận lựa chọn.',
    '/assets/ai/audio/step3_guidance.wav',
  ],
  [
    'Nhập người liên hệ, số điện thoại và điều kiện ra vào. Chọn quan hệ với khu vực và xác nhận quyền giám sát.',
    '/assets/ai/audio/step4_reply.wav',
  ],
  [
    'Điền người liên hệ, số điện thoại và cách vào khu vực. Chọn quan hệ thực tế với khu vực, xác nhận quyền giám sát và khai giấy phép đúng thực tế.',
    '/assets/ai/audio/step4_guidance.wav',
  ],
  [
    'Chọn ngày bắt đầu, ngày kết thúc và khung giờ mong muốn rồi bấm Xác nhận và tiếp tục.',
    '/assets/ai/audio/step5_reply.wav',
  ],
  [
    'Chọn ngày bắt đầu, ngày kết thúc và khung giờ mong muốn.',
    '/assets/ai/audio/step5_guidance.wav',
  ],
  [
    'Kiểm tra lại thông tin, chọn sản phẩm bàn giao và thời hạn lưu trữ. Đọc điều khoản trước khi bấm Xác nhận và tạo yêu cầu.',
    '/assets/ai/audio/step6_reply.wav',
  ],
  [
    'Kiểm tra dịch vụ, vị trí, checklist, liên hệ và lịch. Chọn sản phẩm bàn giao, thời hạn lưu trữ và đọc điều khoản. Bấm Xác nhận và tạo yêu cầu để gửi đơn.',
    '/assets/ai/audio/step6_guidance.wav',
  ],
  [
    'Yêu cầu giám sát của anh chị đã được tạo thành công. Cảm ơn anh chị đã sử dụng OnDemand Monitor.',
    '/assets/ai/audio/order_created.wav',
  ],
]

const NORMALIZED_SEED_MAP = new Map<string, string>(
  EXACT_SEED_ENTRIES.map(([text, url]) => [normalizeSpeechKey(text), url]),
)

/**
 * Returns the static seed WAV URL when the spoken text matches a known guided prompt
 * or the full 4-service welcome consultation script.
 */
export function resolveSeedAudioUrl(text: string): string | null {
  const key = normalizeSpeechKey(text)
  const exact = NORMALIZED_SEED_MAP.get(key)
  if (exact) return exact

  // Welcome consultation speech covering the 4 active services
  if (
    key.startsWith('xin chào anh chị em là trợ lý tư vấn của ondemand monitor') &&
    key.includes('kiểm tra nhà xưởng') &&
    key.includes('giám sát khu vực') &&
    key.includes('giám sát rừng') &&
    key.includes('giám sát công trình')
  ) {
    return '/assets/ai/audio/welcome_full.wav'
  }

  return null
}
