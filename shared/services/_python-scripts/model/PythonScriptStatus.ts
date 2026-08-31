export interface PythonScriptStatus {
    pid: number;
    startTime: Date;

    isRunning: boolean;

    endTime?: Date;
    exitCode?: number;
    message?: string;
}
