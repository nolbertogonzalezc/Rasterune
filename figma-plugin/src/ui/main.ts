import { GoogleSquooshAdapter } from '../../../src/engine/googleSquooshAdapter';
import type { UiToPluginMessage, PluginToUiMessage } from '../shared/messages';
import type { BootstrapPayload, ExportedSelectionItem, FigmaPluginSettings, SelectionItem } from '../shared/types';

const LOGO_SRC = '../assets/rasterune_logo_128x128.png';
const adapter = new GoogleSquooshAdapter();

interface UiState {
  settings: FigmaPluginSettings;
  selection: SelectionItem[];
  status: string;
}

const state: UiState = {
  settings: {
    outputFormat: 'webp',
    quality: 85,
    effort: 6,
  },
  selection: [],
  status: 'Waiting for Figma selection...',
};

function postMessageToPlugin(message: UiToPluginMessage): void {
  parent.postMessage({ pluginMessage: message }, '*');
}

function render(): void {
  const root = document.getElementById('app');
  if (!root) {
    return;
  }

  root.innerHTML = `
    <main class="figma-app">
      <header class="figma-app__header">
        <img class="figma-app__logo" src="${LOGO_SRC}" alt="Rasterune" />
        <div>
          <h1 class="figma-app__title">Rasterune for Figma</h1>
          <p class="figma-app__subtitle">Export the current selection and convert it with your Rasterune settings.</p>
        </div>
      </header>

      <section class="figma-app__section">
        <h2 class="figma-app__section-title">Conversion</h2>
        <div class="figma-app__field">
          <label for="outputFormat">Output format</label>
          <select id="outputFormat" name="outputFormat">
            <option value="webp" ${state.settings.outputFormat === 'webp' ? 'selected' : ''}>WebP</option>
            <option value="avif" ${state.settings.outputFormat === 'avif' ? 'selected' : ''}>AVIF</option>
          </select>
        </div>
        <div class="figma-app__field">
          <label for="quality">Quality</label>
          <div class="figma-app__input-row">
            <input id="quality" name="quality" type="number" min="1" max="100" step="1" value="${state.settings.quality}" />
            <span class="figma-app__hint">1-100</span>
          </div>
        </div>
        <div class="figma-app__field">
          <label for="effort">Effort</label>
          <div class="figma-app__input-row">
            <input id="effort" name="effort" type="number" min="0" max="9" step="1" value="${state.settings.effort}" />
            <span class="figma-app__hint">0-9</span>
          </div>
        </div>
        <p class="figma-app__hint">Rasterune exports the selection from Figma as PNG first, then converts it to the target format.</p>
      </section>

      <section class="figma-app__section">
        <h2 class="figma-app__section-title">Selection</h2>
        ${
          state.selection.length
            ? `<ul class="figma-app__selection-list">${state.selection
                .map((item) => `<li class="figma-app__selection-item">${item.name}</li>`)
                .join('')}</ul>`
            : `<div class="figma-app__empty">Select one or more exportable layers in Figma.</div>`
        }
      </section>

      <div class="figma-app__status">${state.status}</div>

      <footer class="figma-app__footer">
        <button class="figma-app__button figma-app__button--primary" type="button" data-action="convert" ${
          state.selection.length ? '' : 'disabled'
        }>
          Convert selection
        </button>
        <button class="figma-app__button figma-app__button--secondary" type="button" data-action="close">
          Close
        </button>
      </footer>
    </main>
  `;
}

function readSettingsFromForm(): FigmaPluginSettings {
  const outputFormat = (document.getElementById('outputFormat') as HTMLSelectElement).value as FigmaPluginSettings['outputFormat'];
  const quality = Number((document.getElementById('quality') as HTMLInputElement).value);
  const effort = Number((document.getElementById('effort') as HTMLInputElement).value);

  return {
    outputFormat,
    quality: Math.min(100, Math.max(1, quality || 85)),
    effort: Math.min(9, Math.max(0, effort || 6)),
  };
}

async function downloadConvertedItems(items: ExportedSelectionItem[], settings: FigmaPluginSettings): Promise<void> {
  state.status = `Converting ${items.length} item${items.length > 1 ? 's' : ''}...`;
  render();

  for (const item of items) {
    const copiedBytes = item.bytes.slice();
    const result = await adapter.convertImage({
      bytes: copiedBytes.buffer as ArrayBuffer,
      sourceMime: item.sourceMime,
      targetFormat: settings.outputFormat,
      quality: settings.quality,
      effort: settings.effort,
      fileNameBase: item.name,
    });

    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = result.fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  state.status = `Downloaded ${items.length} converted item${items.length > 1 ? 's' : ''}.`;
  render();
}

function applyBootstrap(payload: BootstrapPayload): void {
  state.settings = payload.settings;
  state.selection = payload.selection;
  state.status = payload.selection.length
    ? `Ready to convert ${payload.selection.length} selected item${payload.selection.length > 1 ? 's' : ''}.`
    : 'Select one or more exportable layers in Figma.';
  render();
}

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginToUiMessage }>) => {
  const message = event.data.pluginMessage;
  if (!message) {
    return;
  }

  switch (message.type) {
    case 'BOOTSTRAP':
      applyBootstrap(message.payload);
      break;

    case 'SELECTION_CHANGED':
      state.selection = message.payload.selection;
      state.status = state.selection.length
        ? `Ready to convert ${state.selection.length} selected item${state.selection.length > 1 ? 's' : ''}.`
        : 'Select one or more exportable layers in Figma.';
      render();
      break;

    case 'EXPORT_RESULT':
      void downloadConvertedItems(message.payload.items, message.payload.settings);
      break;

    case 'ERROR':
      state.status = message.payload.message;
      render();
      break;
  }
};

document.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
    return;
  }

  state.settings = readSettingsFromForm();
  postMessageToPlugin({ type: 'SAVE_SETTINGS', payload: { settings: state.settings } });
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const action = target.dataset.action;
  if (action === 'convert') {
    state.settings = readSettingsFromForm();
    postMessageToPlugin({ type: 'EXPORT_SELECTION', payload: { settings: state.settings } });
    return;
  }

  if (action === 'close') {
    postMessageToPlugin({ type: 'CLOSE' });
  }
});

render();
postMessageToPlugin({ type: 'UI_READY' });
