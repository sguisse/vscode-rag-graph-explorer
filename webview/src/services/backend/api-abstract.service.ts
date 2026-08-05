import { getVsCodeApi } from '@/lib/utils-vscode';
import { RpcProtocol } from '@/shared/rpc/rpc-protocol';
import { IBackendService } from '@/shared/services/backend-service.interface';

export abstract class AbstractApiService implements IBackendService {
    protected rpc: RpcProtocol;

    constructor() {
        const vscodeApi = getVsCodeApi();
        this.rpc = new RpcProtocol((msg) => {
            if (vscodeApi) {
                vscodeApi.postMessage(msg);
            } else {
                console.warn('[AbstractApiService] VS Code API unavailable for message:', msg);
            }
        });

        window.addEventListener('message', (event) => {
            this.rpc.receive(event.data);
        });
    }
}
