/**
 * Browser-compatible mock for 'vscode' module in Webview context.
 */
export const window = {
  createOutputChannel: (name: string) => ({
    name,
    appendLine: (msg: string) => console.log(`[OutputChannel: ${name}] ${msg}`),
    append: (msg: string) => console.log(`[OutputChannel: ${name}] ${msg}`),
    clear: () => {},
    show: () => {},
    hide: () => {},
    dispose: () => {},
  }),
  showInformationMessage: async (msg: string) => console.log(`[VSCode Info] ${msg}`),
  showErrorMessage: async (msg: string) => console.error(`[VSCode Error] ${msg}`),
  showWarningMessage: async (msg: string) => console.warn(`[VSCode Warn] ${msg}`),
};

export const commands = {
  executeCommand: async (command: string, ...args: unknown[]) => {
    console.log(`[VSCode Command Execute] ${command}`, ...args);
  },
  registerCommand: (command: string) => ({
    dispose: () => console.log(`[VSCode Command Dispose] ${command}`),
  }),
};

export const workspace = {
  getConfiguration: () => ({
    get: (_key: string, defaultValue?: unknown) => defaultValue,
    has: () => false,
    inspect: () => undefined,
    update: async () => {},
  }),
};

export default {
  window,
  commands,
  workspace,
};
