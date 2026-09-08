export type NotificationPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

export type NotificationType = 'info' | 'warn' | 'error' | 'success';

export interface NotificationAction {
    label: string;
    command: string;
    data?: any;
}

export interface RichNotificationOptions {
    type?: NotificationType;
    position?: NotificationPosition;
    header?: string;
    message?: string;    // Rich HTML for the Webview
    durationMs?: number;
    actions?: NotificationAction[];
}
