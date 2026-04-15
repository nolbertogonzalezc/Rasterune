import { GoogleSquooshAdapter } from '../engine/googleSquooshAdapter';
import { detectSourceMime } from '../engine/fileTypeDetector';
import { deriveBaseFilename } from '../shared/utils/filename';
import { NetworkService } from './networkService';
import { StateService } from './stateService';

const MENU_CONVERTER = 'rasterune-converter';

export async function initializeContextMenu(stateService: StateService): Promise<void> {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: MENU_CONVERTER,
    title: 'Rasterune Converter',
    contexts: ['image'],
    enabled: stateService.getState().enabled,
  });
}

export async function syncContextMenu(stateService: StateService): Promise<void> {
  await chrome.contextMenus.update(MENU_CONVERTER, {
    title: 'Rasterune Converter',
    enabled: stateService.getState().enabled,
  });
}

export function registerContextMenuHandler(stateService: StateService): void {
  const networkService = new NetworkService();
  const adapter = new GoogleSquooshAdapter();

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_CONVERTER) {
      return;
    }

    if (!info.srcUrl) {
      return;
    }

    void (async () => {
      try {
        await handleContextMenuSave({
          info,
          tabUrl: tab?.url ?? info.pageUrl ?? info.srcUrl,
          networkService,
          stateService,
          adapter,
        });
      } catch (error) {
        console.error('[Rasterune:context-menu] Failed to process image save', error);
      }
    })();
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

async function handleContextMenuSave({
  info,
  tabUrl,
  networkService,
  stateService,
  adapter,
}: {
  info: chrome.contextMenus.OnClickData;
  tabUrl: string;
  networkService: NetworkService;
  stateService: StateService;
  adapter: GoogleSquooshAdapter;
}): Promise<void> {
  const effectiveSettings = stateService.getEffectiveSettings(tabUrl);
  if (!effectiveSettings.enabled || !info.srcUrl) {
    return;
  }

  const response = await networkService.fetchImageBytes(info.srcUrl, tabUrl);
  const sourceMime = detectSourceMime(response.bytes);
  if (!sourceMime) {
    return;
  }

  const baseName = deriveBaseFilename(response.finalUrl || info.srcUrl);
  const result = await adapter.convertImage({
    bytes: response.bytes,
    sourceMime,
    targetFormat: effectiveSettings.outputFormat,
    quality: effectiveSettings.quality,
    effort: effectiveSettings.effort,
    fileNameBase: baseName,
  });

  const downloadUrl = await blobToDataUrl(result.blob);

  await chrome.downloads.download({
    url: downloadUrl,
    filename: result.fileName,
    saveAs: true,
  });
}
