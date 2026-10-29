import { defineMessages } from '../../../shared/i18n'

export const socialCallbackPageMessages = defineMessages({
  vi: {
    linkedAccountError:
      'Tài khoản Google này đã được liên kết với một tài khoản Cognito khác. Hãy nhờ quản trị viên gỡ liên kết trùng lặp hoặc làm cho bước liên kết Pre Sign-up của Cognito thành idempotent, rồi thử lại.',
    missingCodeError:
      'Google không trả về mã xác thực (authorization code). Kiểm tra lại URL callback và luồng code của Cognito.',
    signInFailedGeneric:
      'Không thể hoàn tất đăng nhập Google. Vui lòng thử lại.',
    secureWorkspaceAccess: 'Truy cập không gian làm việc an toàn',
    signInFailedTitle: 'Đăng nhập Google thất bại',
    backToSignIn: 'Quay lại đăng nhập',
    accountConnected: 'Đã kết nối tài khoản Google',
    welcome: (name?: string) => `Chào mừng${name ? `, ${name}` : ''}`,
    accountReady:
      'Tài khoản khách hàng của bạn đã sẵn sàng. Tiếp tục vào OnDemand Monitor để quản lý yêu cầu giám sát.',
    continueToApp: 'Tiếp tục vào OnDemand Monitor',
    googleAccount: 'Tài khoản Google',
    finishingSignIn: 'Đang hoàn tất đăng nhập',
    takingLonger:
      'Việc này đang mất nhiều thời gian hơn bình thường. Vui lòng giữ cửa sổ này mở.',
    verifying: 'Đang xác thực tài khoản của bạn một cách an toàn…',
  },
  en: {
    linkedAccountError:
      'This Google account is already linked to another Cognito account. Ask an administrator to remove the duplicate link or make the Cognito Pre Sign-up linking step idempotent, then try again.',
    missingCodeError:
      'Google did not return an authorization code. Check the Cognito callback URL and code flow configuration.',
    signInFailedGeneric:
      'Google sign-in could not be completed. Please try again.',
    secureWorkspaceAccess: 'Secure workspace access',
    signInFailedTitle: 'Google sign-in failed',
    backToSignIn: 'Back to sign in',
    accountConnected: 'Google account connected',
    welcome: (name?: string) => `Welcome${name ? `, ${name}` : ''}`,
    accountReady:
      'Your customer account is ready. Continue to OnDemand Monitor to manage monitoring requests.',
    continueToApp: 'Continue to OnDemand Monitor',
    googleAccount: 'Google account',
    finishingSignIn: 'Finishing sign-in',
    takingLonger:
      'This is taking longer than usual. Please keep this window open.',
    verifying: 'Verifying your account securely…',
  },
})
