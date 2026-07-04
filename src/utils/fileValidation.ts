/**
 * File Upload Validation Utilities
 * 
 * Protects against malicious file uploads by validating:
 * - File size
 * - MIME type
 * - File signature (magic bytes)
 * - Filename safety
 */

export interface FileValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

// Configuration
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILENAME_LENGTH = 255

/**
 * File signature (magic bytes) for common image types
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF] // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46] // RIFF (WebP starts with RIFF)
  ]
}

/**
 * Check file signature (magic bytes) to verify actual file type
 */
function checkFileSignature(bytes: Uint8Array, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType]
  if (!signatures) {
    return false
  }

  return signatures.some(signature => {
    return signature.every((byte, index) => bytes[index] === byte)
  })
}

/**
 * Additional check for WebP (needs to check WEBP string at offset 8)
 */
function isValidWebP(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false
  
  // Check RIFF header
  if (bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46) {
    return false
  }
  
  // Check WEBP string at offset 8
  return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
}

/**
 * Validate image file
 */
export async function validateImageFile(file: File): Promise<FileValidationResult> {
  const warnings: string[] = []

  // 1. Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    }
  }

  // 2. Check MIME type
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Only ${ALLOWED_IMAGE_MIME_TYPES.join(', ')} are allowed`
    }
  }

  // 3. Check filename
  if (file.name.length > MAX_FILENAME_LENGTH) {
    warnings.push('Filename is very long and will be truncated')
  }

  // Check for suspicious filename patterns
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid filename pattern'
    }
  }

  // 4. Validate file signature (magic bytes)
  try {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    if (bytes.length < 12) {
      return {
        valid: false,
        error: 'File is too small to be a valid image'
      }
    }

    // Special handling for WebP
    if (file.type === 'image/webp') {
      if (!isValidWebP(bytes)) {
        return {
          valid: false,
          error: 'File content does not match WebP format'
        }
      }
    } else {
      // Check signature for other formats
      if (!checkFileSignature(bytes, file.type)) {
        return {
          valid: false,
          error: 'File content does not match declared MIME type'
        }
      }
    }

    // 5. Additional checks for dimensions (optional, requires image processing)
    // You can add image dimension validation here if needed

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  } catch {
    return {
      valid: false,
      error: 'Failed to validate file content'
    }
  }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[/\\]/).pop() || 'upload'
  
  // Extract extension
  const lastDot = basename.lastIndexOf('.')
  const name = lastDot > 0 ? basename.substring(0, lastDot) : basename
  const ext = lastDot > 0 ? basename.substring(lastDot) : ''
  
  // Sanitize name
  const safeName = name
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 200) // Leave room for extension and timestamp
  
  // Sanitize extension
  const safeExt = ext
    .replace(/[^a-zA-Z0-9.]/g, '')
    .toLowerCase()
  
  return `${safeName}${safeExt}`
}

/**
 * Generate a safe, unique filename
 */
export function generateSafeFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  
  const lastDot = sanitized.lastIndexOf('.')
  const name = lastDot > 0 ? sanitized.substring(0, lastDot) : sanitized
  const ext = lastDot > 0 ? sanitized.substring(lastDot) : ''
  
  return `${name}_${timestamp}_${random}${ext}`
}

/**
 * Validate multiple files (for batch uploads)
 */
export async function validateImageFiles(files: File[]): Promise<{
  valid: boolean
  results: Array<{ file: File; result: FileValidationResult }>
  errors: string[]
}> {
  const MAX_BATCH_SIZE = 10
  const MAX_BATCH_TOTAL_SIZE = 20 * 1024 * 1024 // 20MB total

  // Check batch size
  if (files.length > MAX_BATCH_SIZE) {
    return {
      valid: false,
      results: [],
      errors: [`Maximum ${MAX_BATCH_SIZE} files allowed per upload`]
    }
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > MAX_BATCH_TOTAL_SIZE) {
    return {
      valid: false,
      results: [],
      errors: [`Total file size exceeds ${MAX_BATCH_TOTAL_SIZE / 1024 / 1024}MB`]
    }
  }

  // Validate each file
  const results = await Promise.all(
    files.map(async file => ({
      file,
      result: await validateImageFile(file)
    }))
  )

  const errors = results
    .filter(r => !r.result.valid)
    .map(r => `${r.file.name}: ${r.result.error}`)

  return {
    valid: errors.length === 0,
    results,
    errors
  }
}

/**
 * Check if file extension matches MIME type
 */
export function validateFileExtension(filename: string, mimeType: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp']
  }

  const expectedExts = mimeToExt[mimeType]
  return expectedExts ? expectedExts.includes(ext || '') : false
}

