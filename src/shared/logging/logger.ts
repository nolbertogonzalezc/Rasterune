export interface Logger {
  debug(message: string, details?: unknown): void;
  info(message: string, details?: unknown): void;
  warn(message: string, details?: unknown): void;
  error(message: string, details?: unknown): void;
}

export function createLogger(context: string, isDebugEnabled: () => boolean): Logger {
  function print(level: 'debug' | 'info' | 'warn' | 'error', message: string, details?: unknown): void {
    if (level === 'debug' && !isDebugEnabled()) {
      return;
    }

    const payload = [`[Rasterune:${context}]`, message];
    if (details === undefined) {
      console[level](...payload);
    } else {
      console[level](...payload, details);
    }
  }

  return {
    debug: (message, details) => print('debug', message, details),
    info: (message, details) => print('info', message, details),
    warn: (message, details) => print('warn', message, details),
    error: (message, details) => print('error', message, details),
  };
}
