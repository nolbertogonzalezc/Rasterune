import { BrowserConversionWorker } from '../engine/browserConversionWorker';
import { detectSourceMime } from '../engine/fileTypeDetector';
import { createLogger } from '../shared/logging/logger';
import { sendRuntimeMessage } from '../shared/messaging/runtimeClient';
import type { ImageFetchPayload } from '../shared/messaging/messageTypes';
import type { EffectiveSettings } from '../shared/state/types';
import { deriveBaseFilename } from '../shared/utils/filename';

interface DownloadAsset {
  fileName: string;
  blob: Blob;
  url: string;
}

export class ConversionOrchestrator {
  private readonly worker = new BrowserConversionWorker();
  private readonly pendingDownloads = new Map<HTMLImageElement, DownloadAsset>();
  private readonly logger = createLogger('content', () => this.settings.debug);
  private settings: EffectiveSettings;

  constructor(settings: EffectiveSettings) {
    this.settings = settings;
  }

  updateSettings(settings: EffectiveSettings): void {
    this.settings = settings;
  }

  hasPendingDownload(image: HTMLImageElement): boolean {
    return this.pendingDownloads.has(image);
  }

  async convert(image: HTMLImageElement): Promise<'download' | 'done'> {
    const response = await sendRuntimeMessage<ImageFetchPayload>({
      type: 'IMAGE/FETCH_BYTES',
      payload: {
        src: image.currentSrc || image.src,
        pageUrl: window.location.href,
      },
    });

    const sourceMime = detectSourceMime(response.bytes);
    if (!sourceMime) {
      throw new Error('Unsupported source image');
    }

    const result = await this.worker.convert({
      bytes: response.bytes,
      sourceMime,
      targetFormat: this.settings.outputFormat,
      quality: this.settings.quality,
      effort: this.settings.effort,
      fileNameBase: deriveBaseFilename(response.finalUrl || image.currentSrc || image.src),
    });

    const existing = this.pendingDownloads.get(image);
    if (existing) {
      URL.revokeObjectURL(existing.url);
    }

    const url = URL.createObjectURL(result.blob);
    const asset = { fileName: result.fileName, blob: result.blob, url };

    if (this.settings.autoDownload) {
      this.triggerDownload(asset);
      window.setTimeout(() => URL.revokeObjectURL(url), 3_000);
      return 'done';
    }

    this.pendingDownloads.set(image, asset);
    return 'download';
  }

  download(image: HTMLImageElement): void {
    const asset = this.pendingDownloads.get(image);
    if (!asset) {
      return;
    }

    this.triggerDownload(asset);
    this.pendingDownloads.delete(image);
    window.setTimeout(() => URL.revokeObjectURL(asset.url), 3_000);
  }

  dispose(): void {
    for (const asset of this.pendingDownloads.values()) {
      URL.revokeObjectURL(asset.url);
    }

    this.pendingDownloads.clear();
  }

  private triggerDownload(asset: DownloadAsset): void {
    this.logger.debug('Trigger download', asset.fileName);
    void sendRuntimeMessage({
      type: 'IMAGE/DOWNLOAD',
      payload: {
        blob: asset.blob,
        fileName: asset.fileName,
      },
    });
  }
}
