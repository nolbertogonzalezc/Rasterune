import { createOutputFilename } from '../shared/utils/filename';
import type { ConversionEngine, ConversionInput, ConversionResult } from './contracts';
import { mapToNativeCodecSettings, mapToVendorCodecSettings } from './codecSettingsMapper';
import { convertWithGoogleSquooshPatch, hasGoogleSquooshPatch } from './vendor/google-squoosh-patch';

async function drawImageToBlob(source: Blob, mimeType: 'image/webp' | 'image/avif', quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const width = bitmap.width;
  const height = bitmap.height;

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('2D context is not available');
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvas.convertToBlob({ type: mimeType, quality });
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('2D context is not available');
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas conversion returned an empty blob'));
        return;
      }

      resolve(blob);
    }, mimeType, quality);
  });
}

export class GoogleSquooshAdapter implements ConversionEngine {
  async convertImage(input: ConversionInput): Promise<ConversionResult> {
    const vendorSettings = mapToVendorCodecSettings(input.targetFormat, input.quality, input.effort);

    if (hasGoogleSquooshPatch()) {
      const result = await convertWithGoogleSquooshPatch({
        ...input,
        quality: vendorSettings.quality,
        effort: vendorSettings.effort,
      });

      if (result) {
        return result;
      }
    }

    const nativeSettings = mapToNativeCodecSettings(input.targetFormat, input.quality);
    const sourceBlob = new Blob([input.bytes], { type: input.sourceMime });
    const blob = await drawImageToBlob(sourceBlob, nativeSettings.mimeType, nativeSettings.quality);
    const extension = nativeSettings.mimeType === 'image/avif' ? 'avif' : 'webp';

    return {
      blob,
      mimeType: nativeSettings.mimeType,
      fileName: createOutputFilename(input.fileNameBase, extension),
    };
  }
}
