export function PostflightErrorBanner({ error }: { error: string }) {
  return (
    <div className="postflight-error" role="alert">
      ⚠️ {error}
    </div>
  )
}
