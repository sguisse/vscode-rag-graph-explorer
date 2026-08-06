export interface BackendEventMessage<T = any> {
    command: string;
    payload?: T;
    config?: T;
    [key: string]: any;
}

export type EventCallback<T = any> = (message: BackendEventMessage<T>) => void;

export class VsCodeHandleMessage {
    private static instance: VsCodeHandleMessage;
    private listeners = new Map<string, Set<EventCallback>>();

    private constructor() {
        this.initMessageListener();
    }

    public static getInstance(): VsCodeHandleMessage {
        if (!VsCodeHandleMessage.instance) {
            VsCodeHandleMessage.instance = new VsCodeHandleMessage();
        }
        return VsCodeHandleMessage.instance;
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
}

export const vsCodeHandleMessage = VsCodeHandleMessage.getInstance();
