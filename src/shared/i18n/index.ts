import de from './locales/de';
import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import type { SupportedLocale } from '../state/types';

const dictionaries = { en, es, fr, de } as const;

export type TranslationKey = keyof typeof en;
export type ResolvedLocale = keyof typeof dictionaries;

export function resolveLocale(locale: SupportedLocale, userLanguage: string): ResolvedLocale {
  if (locale !== 'auto') {
    return locale;
  }

  const short = userLanguage.toLowerCase().slice(0, 2);
  if (short in dictionaries) {
    return short as ResolvedLocale;
  }

  return 'en';
}

export function createTranslator(locale: SupportedLocale, userLanguage: string) {
  const resolvedLocale = resolveLocale(locale, userLanguage);
  const dictionary = dictionaries[resolvedLocale];

  return {
    locale: resolvedLocale,
    t(key: TranslationKey): string {
      return dictionary[key] ?? en[key];
    },
  };
}
