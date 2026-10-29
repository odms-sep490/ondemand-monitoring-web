export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/images/logo-new.png"
      alt="OnDemand Monitor"
      className="auth-brand-mark"
      width={size}
      height={size}
    />
  )
}
