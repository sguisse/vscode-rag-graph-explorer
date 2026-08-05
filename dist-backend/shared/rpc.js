"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcProtocol = void 0;
class RpcProtocol {
    postMessage;
    pendingRequests = new Map();
    methods = new Map();
    constructor(postMessage) {
        this.postMessage = postMessage;
    }
    register(name, fn) {
        this.methods.set(name, fn);
    }
    call(method, ...params) {
        const id = Math.random().toString(36).substring(2);
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.postMessage({ id, method, params });
        });
    }
    async receive(message) {
        if (!message || typeof message !== 'object')
            return;
        const { id, method, params, result, error } = message;
        if (id && !method && this.pendingRequests.has(id)) {
            const { resolve, reject } = this.pendingRequests.get(id);
            this.pendingRequests.delete(id);
            if (error)
                reject(new Error(error));
            else
                resolve(result);
            return;
        }
        if (method && this.methods.has(method)) {
            try {
                const fn = this.methods.get(method);
                const executionResult = await fn(...(params || []));
                if (id)
                    this.postMessage({ id, method: '', result: executionResult });
            }
            catch (err) {
                if (id)
                    this.postMessage({ id, method: '', error: err.message });
            }
        }
    }
}
exports.RpcProtocol = RpcProtocol;
//# sourceMappingURL=rpc.js.map