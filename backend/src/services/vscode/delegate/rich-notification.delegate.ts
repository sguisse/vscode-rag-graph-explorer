import * as vscode from 'vscode';
import { currentWebviewPanel } from '../../../extension';
import {
    RichNotificationOptions,
    NotificationPosition,
    NotificationType,
    NotificationAction
} from '../../../../../shared/services/vscode/model/vscode-rich-notification';

export type { RichNotificationOptions, NotificationPosition, NotificationType, NotificationAction };

export class RichNotificationService {
    constructor(private panel?: vscode.WebviewPanel) {}

    public setPanel(panel: vscode.WebviewPanel | undefined) {
        this.panel = panel;
    }

    private getPanel(): vscode.WebviewPanel | undefined {
        return this.panel || currentWebviewPanel;
    }

    /**
     * Displays a rich notification. Routes to Webview if available, otherwise falls back to native VS Code UI.
     */
    public show(
        fallbackText: string,
        options: RichNotificationOptions = {},
        callback?: (command: string, payload: any) => void
    ) {
        const type = options.type || 'info';
        const position = options.position || 'bottom-right';
        const durationMs = options.durationMs || 3000;
        const panel = this.getPanel();

        // 1. Send to Webview if it is currently active and visible
        if (panel && panel.visible) {
            panel.webview.postMessage({
                command: 'showRichNotification',
                payload: {
                    text: options.message || fallbackText,
                    header: options.header,
                    type,
                    position,
                    durationMs,
                    actions: options.actions
                }
            });
            return;
        }

        // 2. Fallback to native VS Code notifications
        this.fallbackToNative(fallbackText, type, options.actions, callback);
    }

    private fallbackToNative(
        text: string,
        type: NotificationType,
        actions?: NotificationAction[],
        callback?: (command: string, payload: any) => void
    ) {
        const actionLabels = actions
            ? actions.filter(a => a.label !== "Dismiss").map(a => a.label)
            : [];

        let promise: Thenable<string | undefined>;

        switch (type) {
            case 'error':
                promise = vscode.window.showErrorMessage(text, ...actionLabels);
                break;
            case 'warn':
                promise = vscode.window.showWarningMessage(text, ...actionLabels);
                break;
            default:
                promise = vscode.window.showInformationMessage(text, ...actionLabels);
                break;
        }

        promise.then(selection => {
            if (selection && actions && callback) {
                const selectedAction = actions.find(a => a.label === selection);
                if (selectedAction) {
                    callback(selectedAction.command, selectedAction.data);
                }
            }
        });
    }
}

export function showRichNotificationDelegate(
    fallbackText: string,
    options?: RichNotificationOptions,
    callback?: (command: string, payload: any) => void
) {
    const service = new RichNotificationService();
    service.show(fallbackText, options, callback);
}
