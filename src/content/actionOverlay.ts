export type OverlayMode = 'convert' | 'converting' | 'download' | 'done' | 'error';

interface OverlayLabels {
  convert: string;
  converting: string;
  download: string;
  converted: string;
  failed: string;
}

interface OverlayCallbacks {
  onConvert(): void;
  onDownload(): void;
  onHideRequest(): void;
}

const STYLE_ID = 'rasterune-overlay-style';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .squoosh-overlay {
      position: fixed;
      inset: auto auto 0 0;
      z-index: 2147483647;
      display: none;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0)),
        rgba(18, 18, 23, 0.96);
      color: #f5f2ff;
      box-shadow:
        0 12px 28px rgba(0, 0, 0, 0.32),
        inset 0 0 0 1px rgba(91, 44, 207, 0.28);
      font: 12px/1.2 system-ui, sans-serif;
      pointer-events: auto;
      backdrop-filter: blur(10px);
    }

    .squoosh-overlay__button,
    .squoosh-overlay__status {
      white-space: nowrap;
    }

    .squoosh-overlay__button {
      border: 0;
      border-radius: 6px;
      padding: 7px 10px;
      background: #5b2ccf;
      color: #ffffff;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 140ms ease, opacity 140ms ease;
    }

    .squoosh-overlay__button:hover {
      background: #6a39e0;
    }

    .squoosh-overlay__button[disabled] {
      opacity: 0.7;
      cursor: wait;
    }

    .squoosh-overlay__status {
      color: rgba(245, 242, 255, 0.78);
    }
  `;

  document.documentElement.append(style);
}

export class ActionOverlay {
  private readonly root: HTMLDivElement;
  private readonly button: HTMLButtonElement;
  private readonly status: HTMLSpanElement;
  private readonly callbacks: OverlayCallbacks;
  private labels: OverlayLabels;
  private anchor: HTMLImageElement | null = null;
  private mode: OverlayMode = 'convert';

  constructor(callbacks: OverlayCallbacks, labels: OverlayLabels) {
    ensureStyles();
    this.callbacks = callbacks;
    this.labels = labels;

    this.root = document.createElement('div');
    this.root.className = 'squoosh-overlay';

    this.button = document.createElement('button');
    this.button.className = 'squoosh-overlay__button';
    this.button.type = 'button';

    this.status = document.createElement('span');
    this.status.className = 'squoosh-overlay__status';

    this.root.append(this.button, this.status);
    document.documentElement.append(this.root);

    this.button.addEventListener('click', () => {
      if (this.mode === 'download') {
        this.callbacks.onDownload();
        return;
      }

      if (this.mode === 'convert') {
        this.callbacks.onConvert();
      }
    });

    this.root.addEventListener('pointerleave', (event) => {
      const nextTarget = event.relatedTarget;
      if (this.anchor && nextTarget instanceof Node && this.anchor.contains(nextTarget)) {
        return;
      }

      this.callbacks.onHideRequest();
    });
  }

  updateLabels(labels: OverlayLabels): void {
    this.labels = labels;
    if (this.anchor) {
      this.setMode(this.mode);
    }
  }

  show(image: HTMLImageElement, mode: OverlayMode = 'convert'): void {
    this.anchor = image;
    this.root.style.display = 'flex';
    this.setMode(mode);
    this.reposition();
  }

  hide(): void {
    this.root.style.display = 'none';
    this.anchor = null;
  }

  contains(node: Node | null): boolean {
    return node ? this.root.contains(node) : false;
  }

  isVisible(): boolean {
    return this.root.style.display === 'flex';
  }

  reposition(): void {
    if (!this.anchor || !this.isVisible()) {
      return;
    }

    const rect = this.anchor.getBoundingClientRect();
    const width = this.root.offsetWidth || 120;
    const height = this.root.offsetHeight || 42;
    const top = Math.min(window.innerHeight - height - 8, Math.max(8, rect.top + 8));
    const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.right - width - 8));

    this.root.style.top = `${top}px`;
    this.root.style.left = `${left}px`;
  }

  setMode(mode: OverlayMode): void {
    this.mode = mode;

    switch (mode) {
      case 'convert':
        this.button.textContent = this.labels.convert;
        this.button.disabled = false;
        this.status.textContent = '';
        break;
      case 'converting':
        this.button.textContent = this.labels.converting;
        this.button.disabled = true;
        this.status.textContent = '';
        break;
      case 'download':
        this.button.textContent = this.labels.download;
        this.button.disabled = false;
        this.status.textContent = '';
        break;
      case 'done':
        this.button.textContent = this.labels.convert;
        this.button.disabled = false;
        this.status.textContent = this.labels.converted;
        break;
      case 'error':
        this.button.textContent = this.labels.convert;
        this.button.disabled = false;
        this.status.textContent = this.labels.failed;
        break;
    }
  }
}
