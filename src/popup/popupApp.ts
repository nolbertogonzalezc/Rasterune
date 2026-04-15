import { createTranslator } from '../shared/i18n';
import type { AppStatePayload, RuntimeEvent } from '../shared/messaging/messageTypes';
import { addRuntimeMessageListener, sendRuntimeMessage } from '../shared/messaging/runtimeClient';
import type { ExtensionState } from '../shared/state/types';

const LOGO_SRC = '/branding/rasterune.webp';

function render(container: HTMLDivElement, state: ExtensionState): void {
  const translator = createTranslator(state.locale, navigator.language);
  const isEnabled = state.enabled;

  container.innerHTML = `
    <main class="popup">
      <header class="popup__header">
        <div class="popup__brand">
          <img class="popup__logo" src="${LOGO_SRC}" alt="${translator.t('appName')}" />
          <div>
          <h1 class="popup__title">${translator.t('appName')}</h1>
          <p class="popup__status">${translator.t('status')}</p>
          </div>
        </div>
        <span class="popup__badge ${isEnabled ? 'is-enabled' : 'is-disabled'}">
          ${isEnabled ? translator.t('enabled') : translator.t('disabled')}
        </span>
      </header>
      <button class="popup__toggle" type="button" data-action="toggle">
        ${isEnabled ? translator.t('disable') : translator.t('enable')}
      </button>
      <button class="popup__link" type="button" data-action="settings">
        ${translator.t('settings')}
      </button>
    </main>
  `;

  const logo = container.querySelector('.popup__logo');
  if (logo instanceof HTMLImageElement) {
    logo.addEventListener(
      'error',
      () => {
        logo.style.display = 'none';
      },
      { once: true },
    );
  }
}

export async function mountPopupApp(container: HTMLDivElement): Promise<void> {
  let state = (await sendRuntimeMessage<AppStatePayload>({ type: 'APP/GET_STATE' })).state;
  render(container, state);

  container.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;

    if (action === 'toggle') {
      state = (await sendRuntimeMessage<AppStatePayload>({
        type: 'APP/SET_ENABLED',
        payload: { enabled: !state.enabled },
      })).state;
      render(container, state);
      return;
    }

    if (action === 'settings') {
      await sendRuntimeMessage({ type: 'APP/OPEN_OPTIONS' });
    }
  });

  addRuntimeMessageListener((message: RuntimeEvent) => {
    if (message.type === 'APP/STATE_CHANGED') {
      state = message.payload.state;
      render(container, state);
    }
  });
}
