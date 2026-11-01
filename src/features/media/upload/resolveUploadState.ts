/** Storage validation and local transfer are separate states. Pending is not a worker. */
export function resolveUploadState(local: string, backend?: string): string {
  if (
    backend &&
    [
      'AVAILABLE',
      'PENDING_MANAGER_APPROVAL',
      'VALIDATING',
      'REJECTED',
      'MANUAL_UPLOAD_REQUIRED',
    ].includes(backend)
  )
    return backend
  if (local === 'UPLOADING' || local === 'UPLOAD_FAILED') return local
  return backend ?? local
}
