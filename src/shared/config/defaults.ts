import { STATE_VERSION } from './constants';
import type { ExtensionState } from '../state/types';

export const DEFAULT_STATE: ExtensionState = {
  version: STATE_VERSION,
  enabled: true,
  locale: 'auto',
  debug: false,
  conversion: {
    outputFormat: 'webp',
    quality: 85,
    effort: 6,
    autoDownload: true,
  },
  domains: {},
};
