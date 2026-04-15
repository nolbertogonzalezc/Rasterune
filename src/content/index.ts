import { createTranslator } from '../shared/i18n';
import type { BootstrapPayload, RuntimeEvent } from '../shared/messaging/messageTypes';
import { addRuntimeMessageListener, sendRuntimeMessage } from '../shared/messaging/runtimeClient';
import { resolveEffectiveSettings } from '../shared/state/featureToggleManager';
import { PageController } from './pageController';

function getLabels(translator: ReturnType<typeof createTranslator>) {
  return {
    convert: translator.t('convert'),
    converting: translator.t('converting'),
    download: translator.t('download'),
    converted: translator.t('converted'),
    failed: translator.t('failed'),
  };
}

async function bootstrapContent(): Promise<void> {
  const bootstrap = await sendRuntimeMessage<BootstrapPayload>({
    type: 'APP/GET_BOOTSTRAP',
    payload: { url: window.location.href },
  });

  const translator = createTranslator(bootstrap.state.locale, navigator.language);
  const controller = new PageController(bootstrap.effectiveSettings, getLabels(translator));
  controller.sync(bootstrap.effectiveSettings, getLabels(translator));

  const unsubscribe = addRuntimeMessageListener((message: RuntimeEvent) => {
    if (message.type !== 'APP/STATE_CHANGED') {
      return;
    }

    const nextTranslator = createTranslator(message.payload.state.locale, navigator.language);
    const effectiveSettings = resolveEffectiveSettings(message.payload.state, window.location.href);
    controller.sync(effectiveSettings, getLabels(nextTranslator));
  });

  window.addEventListener('beforeunload', () => {
    unsubscribe();
    controller.dispose();
  });
}

void bootstrapContent();
