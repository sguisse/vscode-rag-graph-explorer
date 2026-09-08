import { BackendEventMessage } from '../../../../shared/services/vscode/model/vscode-message-payload';

export type EventCallback<T = any> = (message: BackendEventMessage<T>) => void;


/**
 * Messages are throws from the backend to the webview, in backend/src/extension-commands.ts
 * with `currentWebviewPanel.webview.postMessage({command: command, paths: selectedPath});` for example
 * and this class handles them in the webview (cf vsCodeBackendMessageHandler.on('selectedPath', (msg) => { if (msg.payload) { ... } })).
 * It allows subscribing to specific commands and receiving their payloads.
 * It also allows emitting events locally across all subscribed webview listeners.
 * This is a singleton class, ensuring only one instance handles all backend messages.
 */
export class VsCodeBackendMessageHandler {
    private static instance: VsCodeBackendMessageHandler;
    private listeners = new Map<string, Set<EventCallback>>();

    private constructor() {
        this.initMessageListener();
    }

    public static getInstance(): VsCodeBackendMessageHandler {
        if (!VsCodeBackendMessageHandler.instance) {
            VsCodeBackendMessageHandler.instance = new VsCodeBackendMessageHandler();
        }
        return VsCodeBackendMessageHandler.instance;
    }

    private initMessageListener(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('message', (event: MessageEvent<BackendEventMessage>) => {
            const message = event.data;
            if (!message || typeof message !== 'object') return;

            const command = message.command;
            if (command && this.listeners.has(command)) {
                const callbacks = this.listeners.get(command)!;
                callbacks.forEach((callback) => callback(message));
            }
        });
    }

    /**
     * Subscribes to a backend message command.
     * @returns Cleanup function to remove the event listener (ideal for React useEffect).
     */
    public on<T = any>(command: string, callback: EventCallback<T>): () => void {
        if (!this.listeners.has(command)) {
            this.listeners.set(command, new Set());
        }
        this.listeners.get(command)!.add(callback);

        return () => this.off(command, callback);
    }

    /**
     * Unsubscribes a callback handler from a command event.
     */
    public off<T = any>(command: string, callback: EventCallback<T>): void {
        if (this.listeners.has(command)) {
            this.listeners.get(command)!.delete(callback);
        }
    }

    /**
     * Triggers an event locally across all subscribed webview listeners.
     */
    public emit<T = any>(command: string, messageOrPayload: BackendEventMessage<T> | T): void {
        if (this.listeners.has(command)) {
            const callbacks = this.listeners.get(command)!;
            const message: BackendEventMessage<T> =
                typeof messageOrPayload === 'object' &&
                messageOrPayload !== null &&
                'command' in (messageOrPayload as object)
                    ? (messageOrPayload as BackendEventMessage<T>)
                    : { command, payload: messageOrPayload as T };

            callbacks.forEach((callback) => callback(message));
        }
    }
}

export const vsCodeBackendMessageHandler = VsCodeBackendMessageHandler.getInstance();
