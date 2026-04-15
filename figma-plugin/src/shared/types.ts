export type OutputFormat = 'webp' | 'avif';
export type ExportScale = 1 | 2 | 3 | 4;

export interface FigmaPluginSettings {
  outputFormat: OutputFormat;
  scale: ExportScale;
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
