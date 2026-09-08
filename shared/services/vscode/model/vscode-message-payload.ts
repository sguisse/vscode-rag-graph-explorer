
export interface BackendEventMessage<T = any> {
    command: string;
    payload?: T;
}

export interface VsCodeExplorerSelectedPathsPayload {
    paths: string[];
}

export interface PythonProgressPayload {
    step: string;
    percent: number;
    details?: string;
}

export interface InstallationStatusPayload {
    status: string;
    details?: string;
}
