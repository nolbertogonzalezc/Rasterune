import type { BootstrapPayload, ExportedSelectionItem, FigmaPluginSettings, SelectionItem } from './types';

export type PluginToUiMessage =
  | { type: 'BOOTSTRAP'; payload: BootstrapPayload }
  | { type: 'SELECTION_CHANGED'; payload: { selection: SelectionItem[] } }
  | { type: 'EXPORT_RESULT'; payload: { items: ExportedSelectionItem[]; settings: FigmaPluginSettings } }
  | { type: 'ERROR'; payload: { message: string } };

export type UiToPluginMessage =
  | { type: 'UI_READY' }
  | { type: 'SAVE_SETTINGS'; payload: { settings: FigmaPluginSettings } }
  | { type: 'EXPORT_SELECTION'; payload: { settings: FigmaPluginSettings } }
  | { type: 'CLOSE' };
