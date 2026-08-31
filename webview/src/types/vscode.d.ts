interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(newState: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

interface Window {
  vscodeApi?: VsCodeApi;
}
