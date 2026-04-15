import { initializeContextMenu, registerContextMenuHandler, syncContextMenu } from './contextMenuService';
import { registerMessageRouter } from './messageRouter';
import { StateService } from './stateService';

const stateService = new StateService();

async function bootstrapBackground(): Promise<void> {
  await stateService.loadState();
  await initializeContextMenu(stateService);
  registerMessageRouter(stateService);
  registerContextMenuHandler(stateService);
}

chrome.runtime.onInstalled.addListener(() => {
  void initializeContextMenu(stateService);
});

chrome.runtime.onStartup.addListener(() => {
  void syncContextMenu(stateService);
});

void bootstrapBackground();
