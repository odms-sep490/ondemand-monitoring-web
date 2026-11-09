export type UserRole = 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'ADMIN'

export type AuthProvider = 'LOCAL' | 'GOOGLE'
export type SocialAuthIntent = 'LOGIN_ONLY' | 'LOGIN_OR_REGISTER'

export type RegisterRequest = {
  email: string
  password: string
  fullName: string
  role: UserRole
}

export type LoginRequest = {
  email: string
  password: string
  rememberMe?: boolean
  portalRole?: UserRole
}

export type VerifyOtpRequest = { email: string; otpCode: string }
export type ResendOtpRequest = { email: string }
export type ForgotPasswordRequest = { email: string }
export type ResetPasswordRequest = {
  email: string
  otpCode: string
  newPassword: string
}
export type FirstLoginPasswordChangeRequest = {
  email: string
  session: string
  newPassword: string
  rememberMe?: boolean
}

export type SocialSyncRequest = {
  code: string
  redirectUri: string
  intent?: SocialAuthIntent
  provider?: AuthProvider
  rememberMe?: boolean
}

export type UserProfile = {
  id: string
  fullName: string
  email: string
  emailVerified?: boolean
  role: UserRole
  linkedProviders?: string[]
  avatarUrl?: string
  isActive?: boolean
}

export type RegisterResponse = { otpRequired: boolean }
export type AuthResponse = {
  accessToken?: string
  tokenType: string
  expiresIn?: number
  status?: string
  challengeName?: string
  session?: string
  user?: UserProfile
}

export type EmployeeRole = Exclude<UserRole, 'CUSTOMER' | 'ADMIN'>

export type CreateManagedAccountRequest = {
  email: string
  fullName: string
  role: EmployeeRole
}

export type ManagedAccountResponse = {
  email: string
  role: EmployeeRole
  invitationSent: boolean
  passwordChangeRequired: boolean
}

export type ApiResponse<T> = {
  success: boolean
  code?: string
  message?: string
  data?: T
  errors?: Record<string, string> | unknown
  timestamp?: string
}
