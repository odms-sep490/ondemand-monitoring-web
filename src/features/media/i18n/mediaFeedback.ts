import type { Language } from '../../../shared/i18n'
import { uploadMediaPageMessages } from '../../drone-operator/pages/UploadMedia/UploadMediaPage.messages'

// Stored diagnostic messages remain untouched. Only system feedback presented to the user is localized.
function staticPairs(vi: unknown, en: unknown): [string, string][] {
  if (typeof vi === 'string' && typeof en === 'string') return [[vi, en]]
  if (!vi || !en || typeof vi !== 'object' || typeof en !== 'object') return []
  return Object.keys(vi).flatMap((key) =>
    staticPairs(
      (vi as Record<string, unknown>)[key],
      (en as Record<string, unknown>)[key],
    ),
  )
}
const pairs = staticPairs(
  uploadMediaPageMessages.vi,
  uploadMediaPageMessages.en,
)
const failures: [RegExp, string, string][] = [
  [
    /S3.*(?:upload|transfer).*fail/i,
    'Không thể tải tệp lên kho lưu trữ. Kiểm tra kết nối rồi thử lại.',
    'Could not upload the file to storage. Check the connection and retry.',
  ],
  [
    /^Capture metadata missing/,
    'Không đọc được thời gian chụp trong tệp. Hãy xác nhận thời gian và ghi lý do.',
    'Capture time is missing. Confirm the time and provide a reason.',
  ],
  [
    /^Capture metadata time is invalid/,
    'Thời gian chụp trong tệp không hợp lệ. Hãy kiểm tra tệp gốc từ drone.',
    'The file capture time is invalid. Check the original drone file.',
  ],
  [
    /^Capture metadata time is outside/,
    'Thời gian chụp nằm ngoài thời gian bay. Hãy kiểm tra tệp và nhiệm vụ.',
    'The capture time is outside the mission flight window. Check the file and mission.',
  ],
  [
    /^Capture metadata differs/,
    'Thời gian trong tệp khác thời gian đã khai báo. Hãy xác nhận điều chỉnh và ghi lý do.',
    'The file capture time differs from the declared time. Confirm the correction and provide a reason.',
  ],
  [
    /Failed to fetch|network|offline|kết nối/i,
    'Không thể kết nối. Kiểm tra mạng rồi thử lại.',
    'Could not connect. Check the network and try again.',
  ],
  [
    /duplicate|đã được tải lên/i,
    'Tệp này đã có trong nhiệm vụ. Hãy chọn tệp đã tải lên.',
    'This file already exists in the mission. Select the uploaded file.',
  ],
  [
    /checksum|SHA-256|sha256/i,
    'Nội dung tệp không khớp bản gốc. Hãy chọn đúng tệp và thử lại.',
    'The file does not match the original. Select the correct file and retry.',
  ],
  [
    /not found|không tìm thấy/i,
    'Không tìm thấy tệp. Hãy làm mới thư viện và kiểm tra lại.',
    'File not found. Refresh the library and check again.',
  ],
  [
    /access denied|unauthorized|không có quyền/i,
    'Chưa có quyền thực hiện thao tác. Hãy làm mới hoặc đăng nhập lại.',
    'This action is not authorized. Refresh or sign in again.',
  ],
]
export function mediaFeedback(
  message: string,
  lang: Language,
  kind: 'error' | 'info' = 'error',
): string {
  return message
    .split('\n')
    .map((line) => {
      const pair = pairs.find(([vi, en]) => line === vi || line === en)
      if (pair) return pair[lang === 'vi' ? 0 : 1]
      const count = line.match(
        /^(\d+) (?:tệp đã được gửi (?:vào luồng |để )xác thực\.|files? (?:sent|submitted) for validation\.)$/,
      )
      if (count)
        return lang === 'vi'
          ? `${count[1]} tệp đã được gửi để xác thực.`
          : `${count[1]} files sent for validation.`
      const named = line.match(/^(.*\.(?:jpe?g|png|mp4)):\s+(.+)$/i)
      const reason = named?.[2] ?? line
      const failure = failures.find(
        ([pattern, vi, en]) =>
          pattern.test(reason) || reason === vi || reason === en,
      )
      const copy = failure
        ? failure[lang === 'vi' ? 1 : 2]
        : kind === 'info'
          ? lang === 'vi'
            ? 'Đã gửi yêu cầu. Trạng thái sẽ được cập nhật từ hệ thống.'
            : 'Request sent. Status will be updated by the server.'
          : lang === 'vi'
            ? 'Không thể xử lý tệp. Kiểm tra tệp, quyền truy cập và thử lại.'
            : 'Could not process the file. Check the file and access permissions, then retry.'
      return named ? `${named[1]}: ${copy}` : copy
    })
    .join('\n')
}
