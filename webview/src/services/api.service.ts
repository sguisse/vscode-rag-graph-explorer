import { RpcProtocol } from '@/shared/rpc';
import { IExtensionServices } from '@/shared/services.interface';

function getVsCodeApi() {
    if (!(window as any)._vscodeApi) {
        if (typeof acquireVsCodeApi === 'function') {
            (window as any)._vscodeApi = acquireVsCodeApi();
        } else if ((window as any).vscodeApi) {
            (window as any)._vscodeApi = (window as any).vscodeApi;
        }
    }
    return (window as any)._vscodeApi;
}

class ApiService implements IExtensionServices {
    private rpc: RpcProtocol;

    constructor() {
        const vscodeApi = getVsCodeApi();
        this.rpc = new RpcProtocol((msg) => {
            if (vscodeApi) {
                vscodeApi.postMessage(msg);
            } else {
                console.warn('[ApiService] VS Code API unavailable for message:', msg);
            }
        });

        window.addEventListener('message', (event) => {
            this.rpc.receive(event.data);
        });
    }

    public async runPythonAnalysis(userId: string): Promise<string> {
        return await this.rpc.call('runPythonAnalysis', userId);
    }

    public async logMessage(level: 'info' | 'warn' | 'error', text: string, details?: any): Promise<void> {
        return await this.rpc.call('logMessage', level, text, details);
    }
}

export const apiService = new ApiService();
