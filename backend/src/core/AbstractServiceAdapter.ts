import * as vscode from 'vscode';
import { getCurrentWebviewPanel } from '../utils/utils-vscode';

export abstract class AbstractServiceAdapter {

    /**
     * Sends an asynchronous push event to the frontend Webview.
     */
    public postMessage<T = any>(command: string, payload?: T): void {
        if (getCurrentWebviewPanel()) {
            getCurrentWebviewPanel().webview.postMessage({ command, payload });
        } else {
            console.warn(`[${this.constructor.name}] Unable to send message '${command}': no ​​Webview active.`);
        }
    }
}
