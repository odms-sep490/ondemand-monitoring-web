import { useEffect, useState } from 'react'

import { isValidServiceImage } from '../../../lib/serviceImage'

/** The picture being chosen for a service: the new file, a pending removal and the URL to preview. */
export function useServiceImage(currentUrl: string | null | undefined) {
  const [image, setImage] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)

  useEffect(() => {
    if (!image) {
      setPreview(removeImage ? null : (currentUrl ?? null))
      return
    }
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image, removeImage, currentUrl])

  /** Returns false (and keeps the previous choice) when the file is not an acceptable picture. */
  function pick(file: File) {
    if (!isValidServiceImage(file)) return false
    setImage(file)
    setRemoveImage(false)
    return true
  }
  function remove() {
    setImage(null)
    setRemoveImage(true)
  }
  return { image, removeImage, preview, pick, remove }
}
