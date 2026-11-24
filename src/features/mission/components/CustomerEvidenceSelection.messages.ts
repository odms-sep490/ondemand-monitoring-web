import type { Language } from '../../../shared/i18n'

export const deliverySuggestionMessages = {
  en: {
    request: 'Get AI image suggestions',
    apply: 'Apply suggested images to draft',
    applyHint:
      'Applying replaces the images in your draft and keeps the selected videos.',
    count: (suggested: number, required: number) =>
      `${suggested} of ${required} required images suggested`,
    qualityHint:
      'You can run the image quality check in Mission Media or select eligible images manually.',
    error:
      'Could not load image suggestions. You can still select evidence manually.',
    stale:
      'The suggestion no longer matches this checklist. Get a new suggestion before applying.',
    unknownReason: 'Additional suggestion details are unavailable.',
    recommendations: {
      SUGGESTED: 'AI suggested',
      RESERVE: 'AI reserve',
      REVIEW: 'AI review needed',
    },
    reasons: {
      HUMAN_QUALITY_PASS: 'Passed human quality review',
      TECHNICAL_CHECKS_PASS: 'Passed technical checks',
      SIMILAR_TO_SUGGESTED_IMAGE: 'Similar to a suggested image',
      QUALITY_REVIEW_REQUIRED: 'Quality review required',
      QUALITY_NOT_CHECKED: 'Quality not checked',
      INSUFFICIENT_RECOMMENDABLE_IMAGES:
        'Too few images qualify for a suggestion.',
    },
  },
  vi: {
    request: 'Lấy gợi ý ảnh từ AI',
    apply: 'Áp dụng ảnh gợi ý vào bản nháp',
    applyHint: 'Áp dụng sẽ thay ảnh trong bản nháp và giữ các video đã chọn.',
    count: (suggested: number, required: number) =>
      `Đã gợi ý ${suggested}/${required} ảnh cần bàn giao`,
    qualityHint:
      'Bạn có thể kiểm tra chất lượng ảnh trong mục media của nhiệm vụ hoặc tự chọn ảnh đủ điều kiện.',
    error: 'Không tải được gợi ý ảnh. Bạn vẫn có thể tự chọn bằng chứng.',
    stale:
      'Gợi ý không còn khớp với checklist. Hãy lấy gợi ý mới trước khi áp dụng.',
    unknownReason: 'Không có thông tin chi tiết bổ sung về gợi ý.',
    recommendations: {
      SUGGESTED: 'AI gợi ý',
      RESERVE: 'AI đề xuất dự phòng',
      REVIEW: 'AI đề xuất xem xét',
    },
    reasons: {
      HUMAN_QUALITY_PASS: 'Đã đạt đánh giá chất lượng thủ công',
      TECHNICAL_CHECKS_PASS: 'Đã đạt kiểm tra kỹ thuật',
      SIMILAR_TO_SUGGESTED_IMAGE: 'Tương tự ảnh đã được gợi ý',
      QUALITY_REVIEW_REQUIRED: 'Cần đánh giá chất lượng',
      QUALITY_NOT_CHECKED: 'Chưa kiểm tra chất lượng',
      INSUFFICIENT_RECOMMENDABLE_IMAGES: 'Chưa đủ ảnh đáp ứng tiêu chí gợi ý.',
    },
  },
} as const

export function suggestionReason(lang: Language, code: string) {
  const messages = deliverySuggestionMessages[lang]
  return Object.hasOwn(messages.reasons, code)
    ? messages.reasons[code as keyof typeof messages.reasons]
    : messages.unknownReason
}
