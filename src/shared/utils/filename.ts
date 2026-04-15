export function sanitizeFilenameSegment(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'image';
}

export function deriveBaseFilename(src: string): string {
  try {
    const url = new URL(src);
    const pathname = url.pathname.split('/').filter(Boolean).pop() ?? 'image';
    const name = pathname.replace(/\.[a-z0-9]+$/i, '');
    return sanitizeFilenameSegment(name);
  } catch {
    return 'image';
  }
}

export function createOutputFilename(baseName: string, extension: string): string {
  return `${sanitizeFilenameSegment(baseName)}.${extension}`;
}

export function createVariantFilename(baseName: string, variant: string, extension: string): string {
  return `${sanitizeFilenameSegment(baseName)}-${sanitizeFilenameSegment(variant)}.${extension}`;
}
