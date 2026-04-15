import { DEFAULT_STATE } from '../config/defaults';
import { STORAGE_KEY } from '../config/constants';
import type { ExtensionState } from './types';

export class StorageManager {
  async load(): Promise<Partial<ExtensionState>> {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    return (stored[STORAGE_KEY] as Partial<ExtensionState> | undefined) ?? {};
  }

  async save(state: ExtensionState): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  }

  getDefaults(): ExtensionState {
    return structuredClone(DEFAULT_STATE);
  }
}
