import { isLikelySupportedImageUrl } from '../engine/fileTypeDetector';
import { isHtmlImageElement } from '../shared/utils/guards';

function isRenderableImage(image: HTMLImageElement): boolean {
  const src = image.currentSrc || image.src;
  return Boolean(src) && isLikelySupportedImageUrl(src) && image.width >= 48 && image.height >= 48;
}

export class ImageScanner {
  private readonly candidates = new Set<HTMLImageElement>();
  private observer: MutationObserver | null = null;

  private readonly handleLoad = (event: Event) => {
    const target = event.target;
    if (isHtmlImageElement(target) && isRenderableImage(target)) {
      this.candidates.add(target);
    }
  };

  start(): void {
    this.scan();

    if (!this.observer) {
      this.observer = new MutationObserver(() => this.scan());
      this.observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['src', 'srcset'],
      });
    }

    document.addEventListener('load', this.handleLoad, true);
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.candidates.clear();
    document.removeEventListener('load', this.handleLoad, true);
  }

  scan(): void {
    this.candidates.clear();

    document.querySelectorAll('img[src]').forEach((node) => {
      if (node instanceof HTMLImageElement && isRenderableImage(node)) {
        this.candidates.add(node);
      }
    });
  }

  resolveCandidate(target: EventTarget | null): HTMLImageElement | null {
    if (!target || !(target instanceof Element)) {
      return null;
    }

    const image = target.closest('img');
    if (!(image instanceof HTMLImageElement)) {
      return null;
    }

    return this.candidates.has(image) ? image : null;
  }

  has(image: HTMLImageElement): boolean {
    return this.candidates.has(image);
  }
}
