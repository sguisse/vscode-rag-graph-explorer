
export function getVsCodeApi() {
    if (!(window as any)._vscodeApi) {
        if (typeof acquireVsCodeApi === 'function') {
            (window as any)._vscodeApi = acquireVsCodeApi();
        } else if ((window as any).vscodeApi) {
            (window as any)._vscodeApi = (window as any).vscodeApi;
        }
    }
    return (window as any)._vscodeApi;
}
