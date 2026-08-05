export interface RpcMessage {
    id?: string;
    method: string;
    params?: any[];
    result?: any;
    error?: string;
}

export class RpcProtocol {
    private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();
    private methods = new Map<string, Function>();

    constructor(private postMessage: (message: RpcMessage) => void) {}

    public register(name: string, fn: Function) {
        this.methods.set(name, fn);
    }

    public call(method: string, ...params: any[]): Promise<any> {
        const id = Math.random().toString(36).substring(2);
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.postMessage({ id, method, params });
        });
    }

    public async receive(message: RpcMessage) {
        if (!message || typeof message !== 'object') return;
        const { id, method, params, result, error } = message;

        if (id && !method && this.pendingRequests.has(id)) {
            const { resolve, reject } = this.pendingRequests.get(id)!;
            this.pendingRequests.delete(id);
            if (error) reject(new Error(error));
            else resolve(result);
            return;
        }

        if (method && this.methods.has(method)) {
            try {
                const fn = this.methods.get(method)!;
                const executionResult = await fn(...(params || []));
                if (id) this.postMessage({ id, method: '', result: executionResult });
            } catch (err: any) {
                if (id) this.postMessage({ id, method: '', error: err.message });
            }
        }
    }
}
