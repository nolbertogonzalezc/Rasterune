import type { OutputFormat } from '../shared/state/types';
import { clampNumber } from '../shared/utils/guards';

export interface NativeCodecSettings {
  mimeType: 'image/webp' | 'image/avif';
  quality: number;
}

export interface VendorCodecSettings {
  format: OutputFormat;
  quality: number;
  effort: number;
  avifCqLevel: number;
  avifSpeed: number;
}

export function mapToNativeCodecSettings(targetFormat: OutputFormat, quality: number): NativeCodecSettings {
  return {
    mimeType: targetFormat === 'avif' ? 'image/avif' : 'image/webp',
    quality: clampNumber(quality, 1, 100) / 100,
  };
}

export function mapToVendorCodecSettings(targetFormat: OutputFormat, quality: number, effort: number): VendorCodecSettings {
  const clampedQuality = clampNumber(quality, 1, 100);
  const clampedEffort = clampNumber(effort, 0, 9);

  return {
    format: targetFormat,
    quality: clampedQuality,
    effort: clampedEffort,
    avifCqLevel: Math.round(((100 - clampedQuality) / 100) * 62),
    avifSpeed: Math.max(0, 9 - clampedEffort),
  };
}
