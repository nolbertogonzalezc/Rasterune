import type { RuntimeRequest, RuntimeResponse } from '../shared/messaging/messageTypes';
import { NetworkService } from './networkService';
import { StateService } from './stateService';
import { broadcastStateChanged } from './tabSync';

export function registerMessageRouter(stateService: StateService): void {
  const networkService = new NetworkService();

  chrome.runtime.onMessage.addListener((message: RuntimeRequest, _sender, sendResponse) => {
    void (async () => {
      try {
        const response = await routeMessage(message, stateService, networkService);
        sendResponse(response);
      } catch (error) {
        const messageText = error instanceof Error ? error.message : 'Unknown error';
        sendResponse({ error: messageText });
      }
    })();

    return true;
  });
}

async function routeMessage(
  message: RuntimeRequest,
  stateService: StateService,
  networkService: NetworkService,
): Promise<RuntimeResponse | { error: string }> {
  switch (message.type) {
    case 'APP/GET_STATE':
      return { state: stateService.getState() };

    case 'APP/GET_BOOTSTRAP':
      return {
        state: stateService.getState(),
        effectiveSettings: stateService.getEffectiveSettings(message.payload.url),
      };

    case 'APP/SET_ENABLED': {
      const state = await stateService.setEnabled(message.payload.enabled);
      await broadcastStateChanged(state);
      return { state };
    }

    case 'APP/UPDATE_SETTINGS': {
      const state = await stateService.updateSettings(message.payload);
      await broadcastStateChanged(state);
      return { state };
    }

    case 'APP/OPEN_OPTIONS':
      await chrome.runtime.openOptionsPage();
      return { ok: true };

    case 'IMAGE/FETCH_BYTES':
      return networkService.fetchImageBytes(message.payload.src, message.payload.pageUrl);

    case 'IMAGE/DOWNLOAD': {
      const objectUrl = URL.createObjectURL(message.payload.blob);

      try {
        const downloadId = await chrome.downloads.download({
          url: objectUrl,
          filename: message.payload.fileName,
          saveAs: message.payload.saveAs,
        });

        return { downloadId };
      } finally {
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      }
    }

    default:
      return { error: 'Unsupported message type' };
  }
}
