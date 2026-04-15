export type OutputFormat = 'webp' | 'avif';

export interface FigmaPluginSettings {
  outputFormat: OutputFormat;
  quality: number;
  effort: number;
}

export interface SelectionItem {
  id: string;
  name: string;
}

export interface ExportedSelectionItem {
  name: string;
  bytes: Uint8Array;
  sourceMime: 'image/png';
}

export interface BootstrapPayload {
  settings: FigmaPluginSettings;
  selection: SelectionItem[];
}
