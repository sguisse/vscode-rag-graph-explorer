import { RpcProtocol } from '@/shared/rpc/rpc-protocol';

let vscodeApi: any = null;

export function getVsCodeApi() {
  if (!vscodeApi) {
    if ((window as any).vscode) {
      vscodeApi = (window as any).vscode;
    } else if (typeof (window as any).acquireVsCodeApi === 'function') {
      try {
        vscodeApi = (window as any).acquireVsCodeApi();
        (window as any).vscode = vscodeApi;
      } catch (e) {
        console.warn('[VsCodeApi] acquireVsCodeApi already acquired:', e);
        vscodeApi = (window as any).vscode || { postMessage: () => {} };
      }
    } else {
      vscodeApi = { postMessage: (msg: any) => console.log('[MockVsCodeApi] postMessage:', msg) };
    }
  }
  return vscodeApi;
}

const rpc = new RpcProtocol((msg) => getVsCodeApi().postMessage(msg));

window.addEventListener('message', (event) => {
  if (event.data) {
    rpc.receive(event.data);
  }
});

export abstract class AbstractApiService {
  protected rpc = rpc;
}
