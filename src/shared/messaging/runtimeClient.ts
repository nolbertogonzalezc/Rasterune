import type { RuntimeEvent, RuntimeRequest, RuntimeResponse } from './messageTypes';

export async function sendRuntimeMessage<TResponse extends RuntimeResponse>(
  message: RuntimeRequest,
): Promise<TResponse> {
  return chrome.runtime.sendMessage(message) as Promise<TResponse>;
}

export function addRuntimeMessageListener(
  listener: (message: RuntimeEvent) => void,
): () => void {
  const wrapped = (message: RuntimeEvent) => {
    if (message?.type) {
      listener(message);
    }
  };

  chrome.runtime.onMessage.addListener(wrapped);

  return () => chrome.runtime.onMessage.removeListener(wrapped);
}
