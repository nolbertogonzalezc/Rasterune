import type { EffectiveSettings, ExtensionState } from '../state/types';

export interface AppStatePayload {
  state: ExtensionState;
}

export interface BootstrapPayload extends AppStatePayload {
  effectiveSettings: EffectiveSettings;
}

export interface ImageFetchPayload {
  bytes: ArrayBuffer;
  contentType: string | null;
  finalUrl: string;
}

export interface DownloadRequestPayload {
  blob: Blob;
  fileName: string;
  saveAs?: boolean;
}

export type RuntimeRequest =
  | { type: 'APP/GET_STATE' }
  | { type: 'APP/GET_BOOTSTRAP'; payload: { url: string } }
  | { type: 'APP/SET_ENABLED'; payload: { enabled: boolean } }
  | { type: 'APP/UPDATE_SETTINGS'; payload: Partial<ExtensionState> }
  | { type: 'APP/OPEN_OPTIONS' }
  | { type: 'IMAGE/FETCH_BYTES'; payload: { src: string; pageUrl: string } }
  | { type: 'IMAGE/DOWNLOAD'; payload: DownloadRequestPayload };

export type RuntimeResponse =
  | AppStatePayload
  | BootstrapPayload
  | ImageFetchPayload
  | { downloadId: number }
  | { ok: true }
  | { error: string };

export type RuntimeEvent = {
  type: 'APP/STATE_CHANGED';
  payload: { state: ExtensionState };
};
