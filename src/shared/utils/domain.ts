export function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function getHostFromUrl(url: string): string | null {
  return safeParseUrl(url)?.hostname ?? null;
}

export function getDomainLookupChain(host: string): string[] {
  const segments = host.split('.').filter(Boolean);
  const lookup: string[] = [];

  for (let index = 0; index < segments.length - 1; index += 1) {
    lookup.push(segments.slice(index).join('.'));
  }

  return lookup.length ? lookup : [host];
}
