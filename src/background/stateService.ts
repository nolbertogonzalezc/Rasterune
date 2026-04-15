import { DEFAULT_STATE } from '../shared/config/defaults';
import { STATE_VERSION } from '../shared/config/constants';
import { resolveEffectiveSettings } from '../shared/state/featureToggleManager';
import { StorageManager } from '../shared/state/storageManager';
import type { EffectiveSettings, ExtensionState } from '../shared/state/types';
import { clampNumber } from '../shared/utils/guards';

function normalizeState(input: Partial<ExtensionState>): ExtensionState {
  return {
    version: STATE_VERSION,
    enabled: input.enabled ?? DEFAULT_STATE.enabled,
    locale: input.locale ?? DEFAULT_STATE.locale,
    debug: input.debug ?? DEFAULT_STATE.debug,
    conversion: {
      outputFormat: input.conversion?.outputFormat ?? DEFAULT_STATE.conversion.outputFormat,
      quality: clampNumber(input.conversion?.quality ?? DEFAULT_STATE.conversion.quality, 1, 100),
      effort: clampNumber(input.conversion?.effort ?? DEFAULT_STATE.conversion.effort, 0, 9),
      autoDownload: input.conversion?.autoDownload ?? DEFAULT_STATE.conversion.autoDownload,
    },
    domains: input.domains ?? DEFAULT_STATE.domains,
  };
}

export class StateService {
  private readonly storage = new StorageManager();
  private state: ExtensionState = structuredClone(DEFAULT_STATE);

  async loadState(): Promise<ExtensionState> {
    const stored = await this.storage.load();
    this.state = normalizeState(stored);
    await this.storage.save(this.state);
    return this.state;
  }

  getState(): ExtensionState {
    return this.state;
  }

  async setEnabled(enabled: boolean): Promise<ExtensionState> {
    this.state = { ...this.state, enabled };
    await this.storage.save(this.state);
    return this.state;
  }

  async updateSettings(patch: Partial<ExtensionState>): Promise<ExtensionState> {
    this.state = normalizeState({
      ...this.state,
      ...patch,
      conversion: {
        ...this.state.conversion,
        ...patch.conversion,
      },
      domains: {
        ...this.state.domains,
        ...patch.domains,
      },
    });

    await this.storage.save(this.state);
    return this.state;
  }

  getEffectiveSettings(url: string): EffectiveSettings {
    return resolveEffectiveSettings(this.state, url);
  }
}
