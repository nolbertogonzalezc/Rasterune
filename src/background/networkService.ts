export interface ImageFetchResult {
  bytes: ArrayBuffer;
  contentType: string | null;
  finalUrl: string;
}

export class NetworkService {
  async fetchImageBytes(src: string, pageUrl: string): Promise<ImageFetchResult> {
    const url = new URL(src, pageUrl).toString();
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'default',
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    return {
      bytes: await response.arrayBuffer(),
      contentType: response.headers.get('content-type')?.split(';')[0] ?? null,
      finalUrl: response.url || url,
    };
  }
}
