import type { ExtensionState } from '../shared/state/types';

export async function broadcastStateChanged(state: ExtensionState): Promise<void> {
  const tabs = await chrome.tabs.query({});

  await Promise.all(
    tabs
      .filter((tab) => typeof tab.id === 'number')
      .map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id as number, {
            type: 'APP/STATE_CHANGED',
            payload: { state },
          });
        } catch {
          // Ignore tabs where the content script is not available.
        }
      }),
  );

  try {
    await chrome.runtime.sendMessage({
      type: 'APP/STATE_CHANGED',
      payload: { state },
    });
  } catch {
    // Ignore when no runtime page is listening.
  }
}
