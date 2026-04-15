import { registerMessageRouter } from './messageRouter';
import { StateService } from './stateService';

const stateService = new StateService();

async function bootstrapBackground(): Promise<void> {
  await stateService.loadState();
  registerMessageRouter(stateService);
}

void bootstrapBackground();
