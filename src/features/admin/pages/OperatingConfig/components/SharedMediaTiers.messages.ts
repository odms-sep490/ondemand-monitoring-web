import { defineMessages } from '../../../../../shared/i18n'

export const sharedMediaTiersMessages = defineMessages({
  vi: {
    imageTitle: 'Ảnh vượt định mức',
    videoTitle: 'Video vượt định mức',
    imageNoun: 'ảnh',
    videoNoun: 'video',
    appliesWhen: (noun: string) =>
      `Áp dụng khi số ${noun} khách yêu cầu vượt định mức đã bao gồm.`,
    tierCount: (n: number) => `${n} bậc giá`,
    empty:
      'Chưa có bậc giá. Ảnh/video vượt định mức sẽ không tính được cho đến khi thêm.',
    from: 'Giá trị từ',
    to: 'Giá trị đến',
    blockSize: 'Kích thước khối',
    pricePerBlock: 'Giá mỗi khối',
    ariaFrom: (title: string) => `${title}: từ`,
    ariaTo: (title: string) => `${title}: đến`,
    ariaBlockSize: (title: string) => `${title}: kích thước khối`,
    ariaPricePerBlock: (title: string) => `${title}: giá mỗi khối`,
    fromHelper: 'Mốc kỹ thuật bắt đầu từ 0 cho phần vượt định mức.',
    toHelper: 'Để trống nếu đây là bậc cuối không giới hạn.',
    blockSizeHelper: 'Số lượng được tính thành một đơn vị giá.',
    done: 'Xong',
    edit: 'Chỉnh sửa',
    perBlock: (price: string, size: number, noun: string) =>
      `${price} / mỗi ${size} ${noun}`,
    removeAria: (noun: string, range: string) => `Xóa bậc ${noun} ${range}`,
    removeTitle: 'Xóa bậc giá',
    removeConfirm: (range: string) =>
      `Bạn có chắc muốn xóa bậc giá “${range}”?`,
    add: '+ Thêm bậc giá',
    firstVideo: 'Video đầu tiên',
    rangeFrom: (label: string, from: number) => `${label} từ ${from} trở lên`,
    rangeBetween: (label: string, from: number, to: number) =>
      `${label} ${from}–${to}`,
    imageLabel: 'Ảnh',
    videoLabel: 'Video',
    roundDown: 'Làm tròn xuống',
    roundNearest: 'Làm tròn gần nhất',
    roundUp: 'Làm tròn lên',
    issues: {
      PROFILE: 'Hồ sơ giá chỉ gồm chữ, số, gạch dưới.',
      COMPONENT: 'Thiếu thành phần giá.',
      ALLOWANCE:
        'Định mức đã bao gồm không hợp lệ (số nguyên 0–500, chỉ cho yêu cầu bổ sung).',
      PRICE: 'Nhập giá là số nguyên.',
      NEGATIVE: 'Không được âm.',
      BLOCK_SIZE: 'Kích thước khối phải là số nguyên từ 1.',
      RANGE: '"Đến" phải lớn hơn "Từ".',
      OVERLAP: 'Các bậc chồng lên nhau.',
      GAP: 'Các bậc phải liền nhau, bắt đầu từ 0.',
      OPEN_ENDED: 'Chỉ bậc cuối được để trống "Đến".',
    } as Record<string, string>,
  },
  en: {
    imageTitle: 'Extra images',
    videoTitle: 'Extra videos',
    imageNoun: 'images',
    videoNoun: 'videos',
    appliesWhen: (noun: string) =>
      `Applies when the number of ${noun} the customer requests exceeds the included allowance.`,
    tierCount: (n: number) => `${n} ${n === 1 ? 'tier' : 'tiers'}`,
    empty:
      'No tiers yet. Extra images and videos cannot be priced until you add one.',
    from: 'From',
    to: 'To',
    blockSize: 'Block size',
    pricePerBlock: 'Price per block',
    ariaFrom: (title: string) => `${title}: from`,
    ariaTo: (title: string) => `${title}: to`,
    ariaBlockSize: (title: string) => `${title}: block size`,
    ariaPricePerBlock: (title: string) => `${title}: price per block`,
    fromHelper:
      'Technical threshold; starts at 0 for the part above the allowance.',
    toHelper: 'Leave empty if this is the last, unlimited tier.',
    blockSizeHelper: 'The quantity charged as one pricing unit.',
    done: 'Done',
    edit: 'Edit',
    perBlock: (price: string, size: number, noun: string) =>
      `${price} per ${size} ${noun}`,
    removeAria: (noun: string, range: string) => `Delete ${noun} tier ${range}`,
    removeTitle: 'Delete tier',
    removeConfirm: (range: string) =>
      `Are you sure you want to delete the tier “${range}”?`,
    add: '+ Add tier',
    firstVideo: 'First video',
    rangeFrom: (label: string, from: number) => `${label} ${from} and above`,
    rangeBetween: (label: string, from: number, to: number) =>
      `${label} ${from}–${to}`,
    imageLabel: 'Images',
    videoLabel: 'Videos',
    roundDown: 'Round down',
    roundNearest: 'Round to nearest',
    roundUp: 'Round up',
    issues: {
      PROFILE:
        'Pricing profile may only contain letters, digits and underscores.',
      COMPONENT: 'Missing price component.',
      ALLOWANCE:
        'Invalid included allowance (whole number 0–500, customer-added requirements only).',
      PRICE: 'Enter the price as a whole number.',
      NEGATIVE: 'Must not be negative.',
      BLOCK_SIZE: 'Block size must be a whole number of at least 1.',
      RANGE: '"To" must be greater than "From".',
      OVERLAP: 'Tiers overlap.',
      GAP: 'Tiers must be contiguous, starting from 0.',
      OPEN_ENDED: 'Only the last tier may leave "To" empty.',
    } as Record<string, string>,
  },
})
