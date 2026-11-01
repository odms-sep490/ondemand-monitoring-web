export const SERVICE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const SERVICE_IMAGE_MAX_BYTES = 5 * 1024 * 1024

/** A service picture must be a non-empty JPEG, PNG or WebP of at most 5 MB. */
export const isValidServiceImage = (file: { type: string; size: number }) =>
  SERVICE_IMAGE_TYPES.includes(file.type) &&
  file.size > 0 &&
  file.size <= SERVICE_IMAGE_MAX_BYTES
