import { STATE_VERSION } from '../config/constants';

export type SupportedLocale = 'auto' | 'es' | 'en' | 'fr' | 'de';
export type OutputFormat = 'webp' | 'avif';

export interface DomainRule {
  enabled?: boolean;
  outputFormat?: OutputFormat;
  quality?: number;
  effort?: number;
  autoDownload?: boolean;
}

export interface ConversionSettings {
  outputFormat: OutputFormat;
  quality: number;
  effort: number;
  autoDownload: boolean;
}

export interface ExtensionState {
  version: typeof STATE_VERSION;
  enabled: boolean;
  locale: SupportedLocale;
  debug: boolean;
  conversion: ConversionSettings;
  domains: Record<string, DomainRule>;
}

export interface EffectiveSettings extends ConversionSettings {
  enabled: boolean;
  locale: SupportedLocale;
  debug: boolean;
  domain: string | null;
}
