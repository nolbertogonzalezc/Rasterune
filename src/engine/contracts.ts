import type { OutputFormat } from '../shared/state/types';

export interface ConversionInput {
  bytes: ArrayBuffer;
  sourceMime: 'image/jpeg' | 'image/png';
  targetFormat: OutputFormat;
  quality: number;
  effort: number;
  fileNameBase: string;
}

export interface ConversionResult {
  blob: Blob;
  mimeType: 'image/webp' | 'image/avif';
  fileName: string;
}

export interface ConversionEngine {
  convertImage(input: ConversionInput): Promise<ConversionResult>;
}
