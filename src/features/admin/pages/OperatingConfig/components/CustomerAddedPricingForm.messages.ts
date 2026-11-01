import { defineMessages } from '../../../../../shared/i18n'

export const customerAddedPricingMessages = defineMessages({
  vi: {
    title: 'Giá yêu cầu bổ sung',
    hint: 'Nội dung khách tự thêm ngoài danh mục. Giá = giá nền + diện tích vượt định mức + ảnh vượt định mức + video vượt định mức. Ảnh/video vượt định mức dùng chung bảng giá ảnh và video bên dưới.',
    basePrice: 'Giá cơ bản',
    includedImages: 'Số ảnh đã bao gồm',
    includedVideos: 'Số video đã bao gồm',
    includedArea: 'Diện tích đã bao gồm',
    extraArea: 'Phụ thu diện tích vượt định mức',
    formula:
      'Ví dụ: đơn 8,5 ha với định mức 5 ha tính phụ thu cho 3,5 ha. Đơn lặp N lần tính giá N lần.',
    invalid: 'Nhập số nguyên không âm.',
    basicConfig: 'Cấu hình cơ bản',
    basePriceHeading: 'Giá cơ bản',
    allowanceHeading: 'Định mức đã bao gồm',
    allowanceHint: 'Khách chỉ bị tính thêm khi yêu cầu vượt các số lượng này.',
    overageHeading: 'Chi phí vượt định mức',
    unitImage: 'ảnh',
    unitVideo: 'video',
    unitHa: 'ha',
  },
  en: {
    title: 'Customer-added requirement price',
    hint: 'Work a customer adds outside the catalog. Price = base price + area above the allowance + images above the allowance + videos above the allowance. Extra images and videos use the shared media price list below.',
    basePrice: 'Base price',
    includedImages: 'Included images',
    includedVideos: 'Included videos',
    includedArea: 'Included area',
    extraArea: 'Surcharge per extra hectare',
    formula:
      'Example: an 8.5 ha order with a 5 ha allowance is charged for 3.5 ha. An order repeated N times is priced N times.',
    invalid: 'Enter a non-negative whole number.',
    basicConfig: 'Basic configuration',
    basePriceHeading: 'Base price',
    allowanceHeading: 'Included allowance',
    allowanceHint:
      'The customer is only charged extra when a request exceeds these quantities.',
    overageHeading: 'Charges above the allowance',
    unitImage: 'images',
    unitVideo: 'videos',
    unitHa: 'ha',
  },
})
