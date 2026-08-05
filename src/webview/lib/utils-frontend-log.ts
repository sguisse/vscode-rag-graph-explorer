let currentChannel = 'token-razor';

function formatData(data?: unknown[] | Error): string {
  if (data === undefined) return '';
  if (data instanceof Error) return `\n  Error: ${data.message}\n  Stack: ${data.stack ?? 'N/A'}`;
  if (typeof data === 'object') {
    try {
      return `\n  Data: ${JSON.stringify(data, null, 2)}`;
    } catch {
      return '\n  Data: [Unserializable Object]';
    }
  }
  return `\n  Data: ${String(data)}`;
}

function sendLog(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, data?: unknown[] | Error): void {
  const formattedMessage = `${message}${formatData(data)}`;

  if (typeof window !== 'undefined' && window.vscodeApi?.postMessage) {
    window.vscodeApi.postMessage({
      command: 'log',
      payload: {
        channel: currentChannel,
        level,
        message: formattedMessage,
      },
    });
  } else {
    // Vite Browser Dev fallback
    const prefix = `[${currentChannel}] [${level}]`;
    switch (level) {
      case 'DEBUG': console.debug(prefix, message, data ?? ''); break;
      case 'INFO':  console.info(prefix, message, data ?? ''); break;
      case 'WARN':  console.warn(prefix, message, data ?? ''); break;
      case 'ERROR': console.error(prefix, message, data ?? ''); break;
    }
  }
}

export function logDebug(message: string, data?: unknown[] | Error): void {
  sendLog('DEBUG', message, data);
}

export function logInfo(message: string, data?: unknown[] | Error): void {
  sendLog('INFO', message, data);
}

export function logWarn(message: string, data?: unknown[] | Error): void {
  sendLog('WARN', message, data);
}

export function logError(message: string, data?: unknown[] | Error): void {
  sendLog('ERROR', message, data);
}
