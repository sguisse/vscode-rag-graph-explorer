import * as vscode from 'vscode';

export abstract class AbstractServiceAdapter {
    protected static activePanel: vscode.WebviewPanel | undefined;
    protected static context: vscode.ExtensionContext;

    /**
     * Binds or unbinds the active Webview for all adapters.
     */
    public static setWebviewPanel(panel: vscode.WebviewPanel | undefined): void {
        AbstractServiceAdapter.activePanel = panel;

        panel?.onDidDispose(() => {
            if (AbstractServiceAdapter.activePanel === panel) {
                AbstractServiceAdapter.activePanel = undefined;
            }
        });
    }

    /**
     * Binds or unbinds the active context for all adapters.
     */
    public static setContext(context: vscode.ExtensionContext): void {
        AbstractServiceAdapter.context = context;
    }

    /**
     * Sends an asynchronous push event to the frontend Webview.
     */
    public postMessage<T = any>(command: string, payload?: T): void {
        if (AbstractServiceAdapter.activePanel) {
            AbstractServiceAdapter.activePanel.webview.postMessage({ command, payload });
        } else {
            console.warn(`[${this.constructor.name}] Unable to send message '${command}': no ​​Webview active.`);
        }
    }
}
