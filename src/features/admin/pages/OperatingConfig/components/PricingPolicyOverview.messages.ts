import { defineMessages } from '../../../../../shared/i18n'

export const pricingPolicyOverviewMessages = defineMessages({
  vi: {
    title: 'Chính sách giá mặc định',
    intro:
      'Chính sách giá được sử dụng để tính giá cho các yêu cầu vận hành. Mỗi lần áp dụng sẽ tạo một phiên bản mới; chính sách đã áp dụng không thể chỉnh sửa.',
    draftAria: 'Bản nháp đang chỉnh sửa',
    draftNote: (version: number) =>
      `Đang có bản nháp phiên bản ${version} chưa phát hành.`,
    continueDraft: 'Tiếp tục chỉnh sửa bản nháp',
    activeAria: 'Chính sách đang áp dụng',
    activeEyebrow: 'Đang áp dụng',
    policyName: (version: number, name: string) =>
      `Chính sách giá v${version} · ${name}`,
    effectiveSince: (date: string, rules: number) =>
      `Có hiệu lực từ ${date} · ${rules} quy tắc`,
    createDraft: 'Tạo bản nháp mới',
    readOnlyNote:
      'Chính sách giá đang áp dụng không thể chỉnh sửa trực tiếp. Hãy tạo bản nháp mới để thay đổi và áp dụng.',
    maxDiscount: 'Giảm giá tối đa',
    maxMarkup: 'Mức tăng giá tối đa',
    highRisk: 'Ngưỡng rủi ro cao',
    minRatio: 'Tỷ lệ giá sàn',
    minPrice: 'Giá sàn',
    customerAddedTitle: 'Giá yêu cầu bổ sung',
    customerAddedHint:
      'Giá = giá nền + diện tích vượt định mức + ảnh vượt + video vượt.',
    basePrice: 'Giá nền',
    includedImages: 'Ảnh đã bao gồm',
    includedVideos: 'Video đã bao gồm',
    includedArea: 'Diện tích đã bao gồm',
    extraAreaRate: 'Phụ thu mỗi ha vượt',
    notConfigured: 'Chưa cấu hình',
    mediaTitle: 'Bảng giá ảnh và video dùng chung',
    mediaHint:
      'Ảnh/video vượt định mức, áp dụng cho mọi checklist kể cả yêu cầu bổ sung.',
    extraImages: 'Ảnh vượt định mức',
    extraVideos: 'Video vượt định mức',
    imageNoun: 'ảnh',
    videoNoun: 'video',
    tierFrom: (from: number) => `từ ${from}`,
    tierLine: (range: string, noun: string, price: string, block: string) =>
      `${range} ${noun}: ${price}${block}`,
    perBlock: (size: number, noun: string) => ` mỗi ${size} ${noun}`,
    perUnit: (noun: string) => ` mỗi ${noun}`,
    noActiveTitle: 'Chưa có chính sách giá đang áp dụng',
    noActiveHint:
      'Hệ thống chưa có phiên bản nào được phát hành. Không có chính sách đang áp dụng thì chưa thể nhân bản để chỉnh sửa.',
    versionsTitle: 'Các phiên bản',
    noPolicies: 'Chưa có chính sách giá.',
    fromDate: (date: string) => `từ ${date}`,
    toDate: (date: string) => ` đến ${date}`,
    unpublished: 'chưa phát hành',
    ha: ' ha',
  },
  en: {
    title: 'Default pricing policy',
    intro:
      'The pricing policy is used to price operation requests. Each publish creates a new version; a published policy cannot be edited.',
    draftAria: 'Draft being edited',
    draftNote: (version: number) =>
      `There is an unpublished draft, version ${version}.`,
    continueDraft: 'Continue editing draft',
    activeAria: 'Active policy',
    activeEyebrow: 'Active',
    policyName: (version: number, name: string) =>
      `Pricing policy v${version} · ${name}`,
    effectiveSince: (date: string, rules: number) =>
      `Effective from ${date} · ${rules} ${rules === 1 ? 'rule' : 'rules'}`,
    createDraft: 'Create new draft',
    readOnlyNote:
      'The active pricing policy cannot be edited directly. Create a new draft to make changes and publish them.',
    maxDiscount: 'Maximum discount',
    maxMarkup: 'Maximum markup',
    highRisk: 'High-risk threshold',
    minRatio: 'Minimum price ratio',
    minPrice: 'Minimum price',
    customerAddedTitle: 'Customer-added requirement price',
    customerAddedHint:
      'Price = base price + area above allowance + extra images + extra videos.',
    basePrice: 'Base price',
    includedImages: 'Included images',
    includedVideos: 'Included videos',
    includedArea: 'Included area',
    extraAreaRate: 'Surcharge per extra hectare',
    notConfigured: 'Not configured',
    mediaTitle: 'Shared media price list',
    mediaHint:
      'Extra images and videos above the allowance, applied to every checklist including customer-added requirements.',
    extraImages: 'Extra images',
    extraVideos: 'Extra videos',
    imageNoun: 'images',
    videoNoun: 'videos',
    tierFrom: (from: number) => `from ${from}`,
    tierLine: (range: string, noun: string, price: string, block: string) =>
      `${range} ${noun}: ${price}${block}`,
    perBlock: (size: number, noun: string) => ` per ${size} ${noun}`,
    perUnit: (noun: string) => ` per ${noun.replace(/s$/, '')}`,
    noActiveTitle: 'No active pricing policy',
    noActiveHint:
      'No version has been published yet. Without an active policy there is nothing to copy and edit.',
    versionsTitle: 'Versions',
    noPolicies: 'No pricing policies yet.',
    fromDate: (date: string) => `from ${date}`,
    toDate: (date: string) => ` to ${date}`,
    unpublished: 'unpublished',
    ha: ' ha',
  },
})
