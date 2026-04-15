import type { DomainRule, EffectiveSettings, ExtensionState } from './types';
import { getDomainLookupChain, getHostFromUrl } from '../utils/domain';

export function resolveDomainRule(state: ExtensionState, url: string): {
  domain: string | null;
  rule: DomainRule | null;
} {
  const host = getHostFromUrl(url);
  if (!host) {
    return { domain: null, rule: null };
  }

  for (const domain of getDomainLookupChain(host)) {
    const rule = state.domains[domain];
    if (rule) {
      return { domain, rule };
    }
  }

  return { domain: host, rule: null };
}

export function resolveEffectiveSettings(state: ExtensionState, url: string): EffectiveSettings {
  const { domain, rule } = resolveDomainRule(state, url);

  return {
    enabled: rule?.enabled ?? state.enabled,
    locale: state.locale,
    debug: state.debug,
    domain,
    outputFormat: rule?.outputFormat ?? state.conversion.outputFormat,
    quality: rule?.quality ?? state.conversion.quality,
    effort: rule?.effort ?? state.conversion.effort,
    autoDownload: rule?.autoDownload ?? state.conversion.autoDownload,
  };
}
