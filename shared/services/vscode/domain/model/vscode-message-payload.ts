
export interface PythonProgressPayload {
    step: string;
    percent: number;
    details?: string;
}

export interface InstallationStatusPayload {
    status: string;
    details?: string;
}
