'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import { getWorkspaceExtentionPath } from '../utils/utils-vscode';
import { logInfo, log } from '../utils/utils-log';
import { PythonScriptStatus } from '../../../shared/services/_python-scripts';
import { vsCodeSettingsManager } from './VsCodeSettings.manager';

const PID_PYTHON_PATH_LOCATION = 'pids_python';

export class PythonScriptExecutionManager {
    private static instance: PythonScriptExecutionManager;
    private pidsDir: string;
    private processTimeout: number;
    private timeoutCheckInterval?: NodeJS.Timeout;

    // Active and Completed Process Tracking Stores
    private activeProcesses: Map<number, childProcess.ChildProcess> = new Map();
    private startTimes: Map<number, Date> = new Map();
    private scriptOrigins: Map<number, string> = new Map();
    private finishedProcesses: Map<number, PythonScriptStatus> = new Map();

    // Cap finished process history to avoid unbounded memory growth
    private readonly MAX_FINISHED_PROCESSES = 100;
    private readonly MAX_PROCESS_TIMEOUT_IN_MS = 10000;
    private readonly TIMEOUT_CHECK_INTERVAL_MS = 1000; // Check active processes every 1 second

    private constructor() {
        this.pidsDir = path.join(getWorkspaceExtentionPath(), PID_PYTHON_PATH_LOCATION);
        this.processTimeout = 0;
        this.ensureDirExists();
        this.cleanStalePids();
        this.startTimeoutChecker();
    }

    public getProcessTimeout(): number {
        if (this.processTimeout <= 0) {
            this.processTimeout = vsCodeSettingsManager.getSettings().processTimeout || this.MAX_PROCESS_TIMEOUT_IN_MS;
        }
        return this.processTimeout;
    }

    public static getInstance(): PythonScriptExecutionManager {
        if (!PythonScriptExecutionManager.instance) {
            PythonScriptExecutionManager.instance = new PythonScriptExecutionManager();
        }
        return PythonScriptExecutionManager.instance;
    }

    private ensureDirExists(): void {
        if (!fs.existsSync(this.pidsDir)) {
            try {
                fs.mkdirSync(this.pidsDir, { recursive: true });
            } catch (err) {
                // Directory creation fallback
            }
        }
    }

    private getPidFilePath(pid: number): string {
        return path.join(this.pidsDir, `${pid}.pid`);
    }

    /**
     * Starts the periodic cron checker for process timeouts.
     */
    private startTimeoutChecker(): void {
        this.timeoutCheckInterval = setInterval(() => {
            this.checkActiveProcessesTimeout();
        }, this.TIMEOUT_CHECK_INTERVAL_MS);

        // Allow Node.js event loop to exit cleanly if this timer is the only active handle
        if (this.timeoutCheckInterval && typeof this.timeoutCheckInterval.unref === 'function') {
            this.timeoutCheckInterval.unref();
        }
    }

    /**
     * Checks all running active processes against getProcessTimeout().
     * Kills any process that has exceeded its allowed run time.
     */
    private checkActiveProcessesTimeout(): void {
        const now = Date.now();
        const timeoutMs = this.getProcessTimeout();
        const timeoutSec = timeoutMs / 1000;

        for (const [pid, startTime] of this.startTimes.entries()) {
            const elapsedMs = now - startTime.getTime();

            if (elapsedMs >= timeoutMs) {
                const origin = this.scriptOrigins.get(pid) || `PythonProcess[PID:${pid}]`;
                const timeoutMsg = `process reach timeout of ${timeoutSec} seconds, it has been killed.`;

                log(origin, timeoutMsg);
                logInfo(`[PID:${pid}] ${timeoutMsg}`);

                this.recordFinishedProcess({
                    pid,
                    startTime,
                    endTime: new Date(),
                    isRunning: false,
                    exitCode: -1,
                    message: timeoutMsg
                });

                this.killPid(pid);
            }
        }
    }

    /**
     * Helper to safely store finished status while capping max history size.
     */
    private recordFinishedProcess(status: PythonScriptStatus): void {
        if (this.finishedProcesses.size >= this.MAX_FINISHED_PROCESSES) {
            const oldestPid = this.finishedProcesses.keys().next().value;
            if (oldestPid !== undefined) {
                this.finishedProcesses.delete(oldestPid);
            }
        }
        this.finishedProcesses.set(status.pid, status);
    }

    /**
     * Attaches line-buffered stream readers to route stdout/stderr to log(origin, message).
     */
    private bindStreamLogging(stream: NodeJS.ReadableStream | null, origin: string): void {
        if (!stream) return;

        let buffer = '';
        stream.on('data', (chunk: Buffer | string) => {
            buffer += chunk.toString('utf-8');
            const lines = buffer.split(/\r?\n/);

            // Keep incomplete last line in the buffer
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                if (line.trim()) {
                    log(origin, line);
                }
            }
        });

        stream.on('end', () => {
            if (buffer.trim()) {
                log(origin, buffer.trim());
            }
        });
    }

    /**
     * Registers an active process in memory, records its start time,
     * and sets up exit listeners to transition it to finishedProcesses upon completion.
     */
    public registerProcess(child: childProcess.ChildProcess, scriptOrigin?: string): number | undefined {
        const pid = child.pid;
        if (!pid) return undefined;

        const startTime = new Date();
        const origin = scriptOrigin || `PythonProcess[PID:${pid}]`;

        this.activeProcesses.set(pid, child);
        this.startTimes.set(pid, startTime);
        this.scriptOrigins.set(pid, origin);
        this.ensureDirExists();

        try {
            fs.writeFileSync(this.getPidFilePath(pid), String(pid), 'utf-8');
        } catch (err) {
            // Ignore file write issues
        }

        // Route live output streams
        this.bindStreamLogging(child.stdout, origin);
        this.bindStreamLogging(child.stderr, `${origin}:ERR`);

        const cleanup = () => {
            this.unregisterPid(pid);
        };

        // Transition active process -> finishedProcesses on EXIT
        child.once('exit', (code, signal) => {
            const endTime = new Date();
            const exitMsg = `Process exited with code ${code ?? 'N/A'}${signal ? ` (signal: ${signal})` : ''}`;
            log(origin, exitMsg);

            if (!this.finishedProcesses.has(pid)) {
                this.recordFinishedProcess({
                    pid,
                    startTime: this.startTimes.get(pid) || startTime,
                    endTime,
                    isRunning: false,
                    exitCode: code ?? (signal ? -1 : 0),
                    message: exitMsg
                });
            }

            cleanup();
        });

        // Transition active process -> finishedProcesses on ERROR
        child.once('error', (err) => {
            const endTime = new Date();
            const errorMsg = `Process error: ${err.message}`;
            log(`${origin}:ERR`, errorMsg, err);

            if (!this.finishedProcesses.has(pid)) {
                this.recordFinishedProcess({
                    pid,
                    startTime: this.startTimes.get(pid) || startTime,
                    endTime,
                    isRunning: false,
                    exitCode: 1,
                    message: errorMsg
                });
            }

            cleanup();
        });

        return pid;
    }

    public unregisterPid(pid: number): void {
        this.activeProcesses.delete(pid);
        this.startTimes.delete(pid);
        this.scriptOrigins.delete(pid);

        const pidFile = this.getPidFilePath(pid);
        if (fs.existsSync(pidFile)) {
            try {
                fs.unlinkSync(pidFile);
            } catch (err) {
                // Ignore file deletion errors
            }
        }
    }

    // ─── Query Methods for Process Status ─────────────────────────────────────

    /**
     * Gets the status of any process (active or finished) by PID.
     */
    public getProcessStatus(pid: number): PythonScriptStatus | undefined {
        if (this.activeProcesses.has(pid)) {
            return {
                pid,
                startTime: this.startTimes.get(pid) || new Date(),
                isRunning: true
            };
        }
        return this.finishedProcesses.get(pid);
    }

    /**
     * Returns an array of all recently finished process statuses.
     */
    public getFinishedProcesses(): PythonScriptStatus[] {
        return Array.from(this.finishedProcesses.values());
    }

    /**
     * Clears the historical finished process store.
     */
    public clearFinishedProcesses(): void {
        this.finishedProcesses.clear();
    }

    // ─── Execution Methods ───────────────────────────────────────────────────

    public executeScript(
        scriptPath: string,
        args: string[] = [],
        options: childProcess.SpawnOptions = {}
    ): childProcess.ChildProcess {
        const isWindows = process.platform === 'win32';
        const pythonBinary = isWindows ? 'python' : 'python3';

        // Pass -u flag to python for unbuffered stdout/stderr
        const fullArgs = ['-u', scriptPath, ...args];

        // Ensure PYTHONUNBUFFERED is set in spawn environment
        const spawnOptions: childProcess.SpawnOptions = {
            ...options,
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1',
                ...(options.env || {})
            }
        };

        logInfo(`Executing Python script: ${pythonBinary} ${fullArgs.map(arg => arg.replace(/,/g, ',\n')).join('\n')}`,
               { scriptPath, args, options: spawnOptions });

        const origin = path.basename(scriptPath);
        return this.spawnPythonProcess(pythonBinary, fullArgs, spawnOptions, origin);
    }

    public spawnPythonProcess(
        pythonBinary: string,
        args: string[],
        options: childProcess.SpawnOptions = {},
        origin?: string
    ): childProcess.ChildProcess {
        const child = childProcess.spawn(pythonBinary, args, options);
        this.registerProcess(child, origin);
        return child;
    }

    public killPid(pid: number, signal: NodeJS.Signals | number = 'SIGKILL'): boolean {
        let killed = false;

        const child = this.activeProcesses.get(pid);
        if (child) {
            try {
                child.kill(signal);
                killed = true;
            } catch (err) {
                // Process already exited
            }
        }

        if (this.isRunning(pid)) {
            try {
                process.kill(pid, signal);
                killed = true;
            } catch (err) {
                // Process already dead
            }
        }

        this.unregisterPid(pid);
        return killed;
    }

    public killAll(signal: NodeJS.Signals | number = 'SIGKILL'): void {
        for (const [pid, child] of this.activeProcesses.entries()) {
            try {
                child.kill(signal);
            } catch (err) {
                // Process already dead
            }
        }

        const storedPids = this.getActivePids();
        for (const pid of storedPids) {
            try {
                process.kill(pid, signal);
            } catch (err) {
                // Process already dead
            }
            this.unregisterPid(pid);
        }
    }

    public cleanStalePids(): void {
        if (!fs.existsSync(this.pidsDir)) return;
        try {
            const files = fs.readdirSync(this.pidsDir);
            for (const file of files) {
                if (file.endsWith('.pid')) {
                    const pidStr = file.replace('.pid', '');
                    const pid = parseInt(pidStr, 10);
                    if (!isNaN(pid) && !this.isRunning(pid)) {
                        this.unregisterPid(pid);
                    }
                }
            }
        } catch (err) {
            // Ignore directory read errors
        }
    }

    public getActivePids(): number[] {
        if (!fs.existsSync(this.pidsDir)) return [];
        const activePids: number[] = [];
        try {
            const files = fs.readdirSync(this.pidsDir);
            for (const file of files) {
                if (file.endsWith('.pid')) {
                    const pidStr = file.replace('.pid', '');
                    const pid = parseInt(pidStr, 10);
                    if (!isNaN(pid)) {
                        if (this.isRunning(pid)) {
                            activePids.push(pid);
                        } else {
                            this.unregisterPid(pid);
                        }
                    }
                }
            }
        } catch (err) {
            // Ignore directory read errors
        }
        return activePids;
    }

    public isRunning(pid: number): boolean {
        try {
            process.kill(pid, 0);
            return true;
        } catch (err) {
            return false;
        }
    }
}

export const pythonScriptExecutionManager: PythonScriptExecutionManager = PythonScriptExecutionManager.getInstance();
