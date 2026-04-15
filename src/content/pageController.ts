import { ActionOverlay } from './actionOverlay';
import { ConversionOrchestrator } from './conversionOrchestrator';
import { ImageScanner } from './imageScanner';
import type { EffectiveSettings } from '../shared/state/types';

interface PageLabels {
  convert: string;
  converting: string;
  download: string;
  converted: string;
  failed: string;
}

export class PageController {
  private readonly scanner: ImageScanner;
  private readonly overlay: ActionOverlay;
  private readonly orchestrator: ConversionOrchestrator;
  private active = false;
  private currentImage: HTMLImageElement | null = null;
  private labels: PageLabels;

  private readonly handlePointerOver = (event: PointerEvent) => {
    const image = this.scanner.resolveCandidate(event.target);

    if (!image) {
      return;
    }

    this.currentImage = image;
    this.overlay.show(image, this.orchestrator.hasPendingDownload(image) ? 'download' : 'convert');
  };

  private readonly handlePointerOut = (event: PointerEvent) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && this.overlay.contains(nextTarget)) {
      return;
    }

    const targetImage = this.scanner.resolveCandidate(event.target);
    if (targetImage && targetImage === this.currentImage) {
      this.hideOverlay();
    }
  };

  private readonly handleViewportChange = () => {
    this.overlay.reposition();
  };

  constructor(settings: EffectiveSettings, labels: PageLabels) {
    this.labels = labels;
    this.scanner = new ImageScanner();
    this.orchestrator = new ConversionOrchestrator(settings);
    this.overlay = new ActionOverlay(
      {
        onConvert: () => void this.handleConvert(),
        onDownload: () => this.handleDownload(),
        onHideRequest: () => this.hideOverlay(),
      },
      labels,
    );
  }

  sync(settings: EffectiveSettings, labels: PageLabels): void {
    this.labels = labels;
    this.overlay.updateLabels(labels);
    this.orchestrator.updateSettings(settings);

    if (settings.enabled) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  activate(): void {
    if (this.active) {
      this.scanner.scan();
      return;
    }

    this.active = true;
    this.scanner.start();
    document.addEventListener('pointerover', this.handlePointerOver, true);
    document.addEventListener('pointerout', this.handlePointerOut, true);
    window.addEventListener('scroll', this.handleViewportChange, true);
    window.addEventListener('resize', this.handleViewportChange);
  }

  deactivate(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.currentImage = null;
    this.overlay.hide();
    this.scanner.stop();
    document.removeEventListener('pointerover', this.handlePointerOver, true);
    document.removeEventListener('pointerout', this.handlePointerOut, true);
    window.removeEventListener('scroll', this.handleViewportChange, true);
    window.removeEventListener('resize', this.handleViewportChange);
  }

  dispose(): void {
    this.deactivate();
    this.orchestrator.dispose();
  }

  private async handleConvert(): Promise<void> {
    if (!this.currentImage) {
      return;
    }

    this.overlay.setMode('converting');

    try {
      const outcome = await this.orchestrator.convert(this.currentImage);
      this.overlay.setMode(outcome === 'download' ? 'download' : 'done');
    } catch {
      this.overlay.setMode('error');
    }
  }

  private handleDownload(): void {
    if (!this.currentImage) {
      return;
    }

    this.orchestrator.download(this.currentImage);
    this.overlay.setMode('done');
  }

  private hideOverlay(): void {
    this.overlay.hide();
    this.currentImage = null;
  }
}
