import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'

type OriginalMetadata = { fileSize: number; contentType: string; checksumSha256: string }
type SignedUpload = { uploadUrl: string | null; uploadHeaders: Record<string, string[]> }
export type PcUploadPlan = SignedUpload & {
  uploadMethod: 'PUT' | 'MULTIPART' | null; partSizeBytes: number; partCount: number
}

/** Read in bounded chunks rather than retaining a whole video in browser memory. */
export async function hashMediaFile(file: File): Promise<string> {
  const hash = sha256.create()
  const chunkSize = 1024 * 1024
  for (let offset = 0; offset < file.size; offset += chunkSize) {
    hash.update(new Uint8Array(await file.slice(offset, offset + chunkSize).arrayBuffer()))
  }
  return bytesToHex(hash.digest())
}

export async function verifyPcBackup(file: File, original: OriginalMetadata): Promise<string> {
  if (file.size !== original.fileSize || (file.type && file.type !== original.contentType)) {
    throw new Error('File phải có cùng kích thước và loại với bản gốc.')
  }
  const checksum = await hashMediaFile(file)
  if (checksum.toLowerCase() !== original.checksumSha256.toLowerCase()) {
    throw new Error('SHA-256 không khớp bản gốc. Không thể dùng file khác để khôi phục media này.')
  }
  return checksum
}

async function put(signed: SignedUpload, body: Blob): Promise<string | null> {
  if (!signed.uploadUrl) throw new Error('Missing signed upload URL')
  const headers = new Headers()
  for (const [name, values] of Object.entries(signed.uploadHeaders ?? {})) {
    // Browser supplies Host and Content-Length; attempting to set them is forbidden.
    if (!['host', 'content-length'].includes(name.toLowerCase())) headers.set(name, values.join(','))
  }
  const response = await fetch(signed.uploadUrl, {
    method: 'PUT', headers, body, credentials: 'omit', signal: AbortSignal.timeout(300000),
  })
  if (!response.ok) throw new Error(`S3 upload HTTP ${response.status}`)
  return response.headers.get('ETag')
}

export async function transferPcBackup(file: File, plan: PcUploadPlan,
  signPart: (partNumber: number) => Promise<SignedUpload>) {
  const parts: Array<{ partNumber: number; eTag: string }> = []
  if (plan.uploadMethod === 'PUT') {
    await put(plan, file)
  } else if (plan.uploadMethod === 'MULTIPART') {
    // Sign just before each part so large videos do not use expired precomputed URLs.
    for (let partNumber = 1; partNumber <= plan.partCount; partNumber++) {
      const start = (partNumber - 1) * plan.partSizeBytes
      const eTag = await put(await signPart(partNumber), file.slice(start, start + plan.partSizeBytes))
      if (!eTag) throw new Error('S3 CORS phải expose ETag để hoàn tất multipart upload.')
      parts.push({ partNumber, eTag })
    }
  } else {
    throw new Error('No upload method available')
  }
  return parts
}
