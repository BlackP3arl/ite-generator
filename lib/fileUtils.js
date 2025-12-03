import path from 'path';

// Sanitize filename to prevent path traversal
export function sanitizeFilename(filename) {
  // Remove path separators, null bytes, and other dangerous characters
  const sanitized = filename
    .replace(/[/\\:*?"<>|\x00]/g, '_')
    .replace(/\.\./g, '_')  // Remove .. sequences
    .substring(0, 255);  // Limit length

  // Ensure filename doesn't start with a dot (hidden files)
  return sanitized.startsWith('.') ? `file${sanitized}` : sanitized;
}

// Validate file path is within allowed directory
export function validateFilePath(filePath, allowedDir) {
  const resolvedPath = path.resolve(filePath);
  const resolvedAllowedDir = path.resolve(allowedDir);

  if (!resolvedPath.startsWith(resolvedAllowedDir)) {
    throw new Error('Invalid file path - path traversal detected');
  }

  return resolvedPath;
}

// File upload validation configuration
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['application/pdf'],
  PDF_MAGIC_BYTES: Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF-
};

// Validate uploaded file
export function validateUploadedFile(file) {
  const errors = [];

  // Check if file exists
  if (!file || !(file instanceof Blob)) {
    errors.push('Invalid file');
  }

  // Check file size
  if (file && file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File too large (max ${FILE_UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  // Check MIME type
  if (file && !FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push('Only PDF files are allowed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Verify PDF magic bytes
export function verifyPDFFile(buffer) {
  const magicBytes = FILE_UPLOAD_CONFIG.PDF_MAGIC_BYTES;

  // Check if buffer starts with %PDF-
  if (buffer.length < magicBytes.length) {
    return false;
  }

  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) {
      return false;
    }
  }

  return true;
}
