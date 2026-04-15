/// <reference types="@figma/plugin-typings" />

import type { PluginToUiMessage, UiToPluginMessage } from './shared/messages';
import type { BootstrapPayload, FigmaPluginSettings, SelectionItem } from './shared/types';

declare const __html__: string;

const STORAGE_KEY = 'rasterune:figma-settings';
const DEFAULT_SETTINGS: FigmaPluginSettings = {
  outputFormat: 'webp',
  quality: 85,
  effort: 6,
};

function isExportableNode(node: SceneNode): node is SceneNode & ExportMixin {
  return 'exportAsync' in node;
}

function serializeSelection(): SelectionItem[] {
  return figma.currentPage.selection
    .filter(isExportableNode)
    .map((node) => ({ id: node.id, name: node.name || 'Layer' }));
}

async function loadSettings(): Promise<FigmaPluginSettings> {
  const stored = await figma.clientStorage.getAsync(STORAGE_KEY);
  return Object.assign({}, DEFAULT_SETTINGS, stored || {});
}

async function saveSettings(settings: FigmaPluginSettings): Promise<void> {
  await figma.clientStorage.setAsync(STORAGE_KEY, settings);
}

function postToUi(message: PluginToUiMessage): void {
  figma.ui.postMessage(message);
}

async function bootstrapUi(): Promise<void> {
  const payload: BootstrapPayload = {
    settings: await loadSettings(),
    selection: serializeSelection(),
  };

  postToUi({ type: 'BOOTSTRAP', payload });
}

async function exportSelection(settings: FigmaPluginSettings): Promise<void> {
  const exportableNodes = figma.currentPage.selection.filter(isExportableNode);

  if (!exportableNodes.length) {
    postToUi({ type: 'ERROR', payload: { message: 'Select at least one exportable layer in Figma.' } });
    return;
  }

  const items = await Promise.all(
    exportableNodes.map(async (node) => ({
      name: node.name || 'Layer',
      bytes: await node.exportAsync({ format: 'PNG' }),
      sourceMime: 'image/png' as const,
    })),
  );

  postToUi({
    type: 'EXPORT_RESULT',
    payload: {
      items,
      settings,
    },
  });
}

figma.showUI(__html__, {
  width: 380,
  height: 560,
  themeColors: true,
});

figma.on('selectionchange', () => {
  postToUi({
    type: 'SELECTION_CHANGED',
    payload: { selection: serializeSelection() },
  });
});

figma.ui.onmessage = async (message: UiToPluginMessage) => {
  switch (message.type) {
    case 'UI_READY':
      await bootstrapUi();
      break;

    case 'SAVE_SETTINGS':
      await saveSettings(message.payload.settings);
      break;

    case 'EXPORT_SELECTION':
      await saveSettings(message.payload.settings);
      await exportSelection(message.payload.settings);
      break;

    case 'CLOSE':
      figma.closePlugin();
      break;
  }
};
