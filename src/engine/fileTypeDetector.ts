export type SourceMimeType = 'image/jpeg' | 'image/png';

function isJpeg(view: Uint8Array): boolean {
  return view.length > 2 && view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff;
}

function isPng(view: Uint8Array): boolean {
  return (
    view.length > 7 &&
    view[0] === 0x89 &&
    view[1] === 0x50 &&
    view[2] === 0x4e &&
    view[3] === 0x47 &&
    view[4] === 0x0d &&
    view[5] === 0x0a &&
    view[6] === 0x1a &&
    view[7] === 0x0a
  );
}

export function detectSourceMime(bytes: ArrayBuffer): SourceMimeType | null {
  const view = new Uint8Array(bytes.slice(0, 16));

  if (isJpeg(view)) {
    return 'image/jpeg';
  }

  if (isPng(view)) {
    return 'image/png';
  }

  return null;
}

export function isLikelySupportedImageUrl(url: string): boolean {
  return /\.(jpe?g|png)(?:$|\?)/i.test(url);
}
