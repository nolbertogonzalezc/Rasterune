import { createTranslator } from '../shared/i18n';
import type { AppStatePayload, RuntimeEvent } from '../shared/messaging/messageTypes';
import { addRuntimeMessageListener, sendRuntimeMessage } from '../shared/messaging/runtimeClient';
import type { ExtensionState, OutputFormat, SupportedLocale } from '../shared/state/types';

function createOption(selected: boolean, value: string, label: string): string {
  return `<option value="${value}" ${selected ? 'selected' : ''}>${label}</option>`;
}

function render(container: HTMLDivElement, state: ExtensionState): void {
  const translator = createTranslator(state.locale, navigator.language);

  container.innerHTML = `
    <main class="options">
      <header class="options__header">
        <div>
          <h1 class="options__title">${translator.t('optionsTitle')}</h1>
          <p class="options__subtitle">${translator.t('optionsSubtitle')}</p>
        </div>
        <span class="options__saved" id="saved-indicator">${translator.t('saved')}</span>
      </header>

      <section class="options__section">
        <h2>${translator.t('conversionSection')}</h2>
        <label class="options__field">
          <span>${translator.t('outputFormat')}</span>
          <select name="outputFormat">
            ${createOption(state.conversion.outputFormat === 'webp', 'webp', 'WebP')}
            ${createOption(state.conversion.outputFormat === 'avif', 'avif', 'AVIF')}
          </select>
        </label>
        <label class="options__field">
          <span>${translator.t('quality')} <button class="options__info" type="button" title="${translator.t('qualityInfo')}">i</button></span>
          <input name="quality" type="range" min="1" max="100" value="${state.conversion.quality}" />
          <strong>${state.conversion.quality}</strong>
        </label>
        <label class="options__field">
          <span>${translator.t('effort')} <button class="options__info" type="button" title="${translator.t('effortInfo')}">i</button></span>
          <input name="effort" type="range" min="0" max="9" value="${state.conversion.effort}" />
          <strong>${state.conversion.effort}</strong>
        </label>
        <label class="options__toggle">
          <span>${translator.t('autoDownload')}</span>
          <input name="autoDownload" type="checkbox" ${state.conversion.autoDownload ? 'checked' : ''} />
        </label>
      </section>

      <section class="options__section">
        <h2>${translator.t('generalSection')}</h2>
        <label class="options__toggle">
          <span>${translator.t('debug')}</span>
          <input name="debug" type="checkbox" ${state.debug ? 'checked' : ''} />
        </label>
        <label class="options__field">
          <span>${translator.t('language')}</span>
          <select name="locale">
            ${createOption(state.locale === 'auto', 'auto', translator.t('languageAuto'))}
            ${createOption(state.locale === 'es', 'es', translator.t('languageEs'))}
            ${createOption(state.locale === 'en', 'en', translator.t('languageEn'))}
            ${createOption(state.locale === 'fr', 'fr', translator.t('languageFr'))}
            ${createOption(state.locale === 'de', 'de', translator.t('languageDe'))}
          </select>
        </label>
      </section>
    </main>
  `;
}

async function persist(container: HTMLDivElement, state: ExtensionState): Promise<ExtensionState> {
  const outputFormat = (container.querySelector('[name="outputFormat"]') as HTMLSelectElement).value as OutputFormat;
  const quality = Number((container.querySelector('[name="quality"]') as HTMLInputElement).value);
  const effort = Number((container.querySelector('[name="effort"]') as HTMLInputElement).value);
  const autoDownload = (container.querySelector('[name="autoDownload"]') as HTMLInputElement).checked;
  const debug = (container.querySelector('[name="debug"]') as HTMLInputElement).checked;
  const locale = (container.querySelector('[name="locale"]') as HTMLSelectElement).value as SupportedLocale;

  return (
    await sendRuntimeMessage<AppStatePayload>({
      type: 'APP/UPDATE_SETTINGS',
      payload: {
        debug,
        locale,
        conversion: {
          outputFormat,
          quality,
          effort,
          autoDownload,
        },
      },
    })
  ).state;
}

export async function mountOptionsApp(container: HTMLDivElement): Promise<void> {
  let state = (await sendRuntimeMessage<AppStatePayload>({ type: 'APP/GET_STATE' })).state;
  render(container, state);

  container.addEventListener('input', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (target instanceof HTMLInputElement && target.type === 'range') {
      const valueNode = target.parentElement?.querySelector('strong');
      if (valueNode) {
        valueNode.textContent = target.value;
      }
    }

    state = await persist(container, state);
    render(container, state);
  });

  addRuntimeMessageListener((message: RuntimeEvent) => {
    if (message.type === 'APP/STATE_CHANGED') {
      state = message.payload.state;
      render(container, state);
    }
  });
}
