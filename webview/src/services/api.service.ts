import { RpcProtocol } from '../../../shared/rpc';
import { IExtensionServices } from '../../../shared/services.interface';

class ApiService implements IExtensionServices {
    private rpc: RpcProtocol;

    constructor() {
        const vscodeApi = (window as any).acquireVsCodeApi ? (window as any).acquireVsCodeApi() : (window as any).vscodeApi;
        this.rpc = new RpcProtocol((msg) => vscodeApi?.postMessage(msg));
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
