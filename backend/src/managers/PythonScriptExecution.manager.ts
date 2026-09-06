'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import { getWorkspaceExtentionPath } from '../utils/utils-vscode';
import { logInfo, log } from '../utils/utils-log';
import { PythonScriptStatus } from '../../../shared/services/_python-scripts';
import { vsCodeSettingsManager } from './VsCodeSettings.manager';

const PID_PYTHON_PATH_LOCATION = 'pids_python';

/**
 * Safely wraps argument values in single quotes ('...') so special Bash characters
 * (| ( ) ? $ * \ ^ +) are treated as literal strings during terminal execution.
 */
function escapeBashArg(arg: string): string {
    if (arg === undefined || arg === null) return "''";
    // Flags without spaces or special characters remain as-is
    if (/^--?[a-zA-Z0-9-]+$/.test(arg)) {
        return arg;
    }
    let clean = arg;
    if ((clean.startsWith("'") && clean.endsWith("'")) || (clean.startsWith('"') && clean.endsWith('"'))) {
        clean = clean.slice(1, -1);
    }
    // Escape internal single quotes for Bash: ' -> '\''
    const escaped = clean.replace(/'/g, "'\\''");
    return `'${escaped}'`;
}

export class PythonScriptExecutionManager {
    private static instance: PythonScriptExecutionManager;
    private pidsDir: string;
    private processTimeout: number;
    private timeoutCheckInterval?: NodeJS.Timeout;

    // Active and Completed Process Tracking Stores
    private activeProcesses: Map<number, childProcess.ChildProcess> = new Map();
    private startTimes: Map<number, Date> = new Map();
    private scriptOrigins: Map<number, string> = new Map();
    private processTimeouts: Map<number, number> = new Map();
    private processCommands: Map<number, string> = new Map();
    private finishedProcesses: Map<number, PythonScriptStatus> = new Map();

    private readonly MAX_FINISHED_PROCESSES = 100;
    private readonly MAX_PROCESS_TIMEOUT_IN_MS = 10000;
    private readonly TIMEOUT_CHECK_INTERVAL_MS = 1000;

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

    private playCompletionSound(soundPath: string): void {
        const cleanPath = soundPath ? soundPath.trim() : '';
        if (!cleanPath) return;

        try {
            const platform = process.platform;
            if (platform === 'darwin') {
                const escaped = cleanPath.replace(/"/g, '\\"');
                childProcess.exec(`afplay "${escaped}"`);
            } else if (platform === 'win32') {
                const escaped = cleanPath.replace(/'/g, "''");
                childProcess.exec(`powershell -c "(New-Object Media.SoundPlayer '${escaped}').PlaySync()"`);
            } else if (platform === 'linux') {
                const escaped = cleanPath.replace(/"/g, '\\"');
                childProcess.exec(`paplay "${escaped}" || aplay "${escaped}" || printf "\\a"`);
            }
        } catch (err) {
            // Fail silently
        }
    }

    private startTimeoutChecker(): void {
        this.timeoutCheckInterval = setInterval(() => {
            this.checkActiveProcessesTimeout();
        }, this.TIMEOUT_CHECK_INTERVAL_MS);

        if (this.timeoutCheckInterval && typeof this.timeoutCheckInterval.unref === 'function') {
            this.timeoutCheckInterval.unref();
        }
    }

    private checkActiveProcessesTimeout(): void {
        const now = Date.now();
        const defaultTimeoutMs = this.getProcessTimeout();

        for (const [pid, startTime] of this.startTimes.entries()) {
            const elapsedMs = now - startTime.getTime();
            const timeoutMs = this.processTimeouts.get(pid) ?? defaultTimeoutMs;
            const timeoutSec = timeoutMs / 1000;

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
                    message: timeoutMsg,
                    command: this.processCommands.get(pid)
                });

                this.killPid(pid);
            }
        }
    }

    private recordFinishedProcess(status: PythonScriptStatus): void {
        if (this.finishedProcesses.size >= this.MAX_FINISHED_PROCESSES) {
            const oldestPid = this.finishedProcesses.keys().next().value;
            if (oldestPid !== undefined) {
                this.finishedProcesses.delete(oldestPid);
            }
        }
        const cmd = status.command || (status.pid ? this.processCommands.get(status.pid) : undefined);
        this.finishedProcesses.set(status.pid, {
            ...status,
            command: cmd
        });
    }

    private bindStreamLogging(stream: NodeJS.ReadableStream | null, origin: string): void {
        if (!stream) return;

        let buffer = '';
        stream.on('data', (chunk: Buffer | string) => {
            buffer += chunk.toString('utf-8');
            const lines = buffer.split(/\r?\n/);
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

    public registerProcess(
        child: childProcess.ChildProcess,
        scriptOrigin?: string,
        timeout?: number,
        command?: string
    ): number | undefined {
        const pid = child.pid;
        if (!pid) return undefined;

        const startTime = new Date();
        const origin = scriptOrigin || `PythonProcess[PID:${pid}]`;

        this.activeProcesses.set(pid, child);
        this.startTimes.set(pid, startTime);
        this.scriptOrigins.set(pid, origin);
        if (command) {
            this.processCommands.set(pid, command);
        }

        if (timeout && timeout > 0) {
            this.processTimeouts.set(pid, timeout);
        }
        this.ensureDirExists();

        try {
            fs.writeFileSync(this.getPidFilePath(pid), String(pid), 'utf-8');
        } catch (err) {
            // Ignore file write issues
        }

        this.bindStreamLogging(child.stdout, origin);
        this.bindStreamLogging(child.stderr, `${origin}:ERR`);

        const cleanup = () => {
            this.unregisterPid(pid);
        };

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
                    message: exitMsg,
                    command: this.processCommands.get(pid) || command
                });
            }

            cleanup();
        });

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
                    message: errorMsg,
                    command: this.processCommands.get(pid) || command
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
        this.processTimeouts.delete(pid);
        this.processCommands.delete(pid);

        const pidFile = this.getPidFilePath(pid);
        if (fs.existsSync(pidFile)) {
            try {
                fs.unlinkSync(pidFile);
            } catch (err) {
                // Ignore file deletion errors
            }
        }
    }

    public getProcessInstance(pid: number): childProcess.ChildProcess | undefined {
        return this.activeProcesses.get(pid);
    }

    public getProcessStatus(pid: number): PythonScriptStatus | undefined {
        if (this.activeProcesses.has(pid)) {
            return {
                pid,
                startTime: this.startTimes.get(pid) || new Date(),
                isRunning: true,
                command: this.processCommands.get(pid)
            };
        }
        return this.finishedProcesses.get(pid);
    }

    public getFinishedProcesses(): PythonScriptStatus[] {
        return Array.from(this.finishedProcesses.values());
    }

    public clearFinishedProcesses(): void {
        this.finishedProcesses.clear();
    }

    public executeScript(
        scriptPath: string,
        args: string[] = [],
        options: childProcess.SpawnOptions = {},
        timeout?: number
    ): childProcess.ChildProcess {
        const isWindows = process.platform === 'win32';
        const pythonBinary = isWindows ? 'python' : 'python3';

        const absScriptPath = path.isAbsolute(scriptPath) ? scriptPath : path.resolve(scriptPath);
        const fullArgs = ['-u', absScriptPath, ...args];

        // Format all argument values strictly in single-quotes for safe shell execution
        const formattedArgs = args.map(escapeBashArg);
        const commandStr = `${pythonBinary} ${escapeBashArg(absScriptPath)} ${formattedArgs.join(' ')}`;

        const spawnOptions: childProcess.SpawnOptions = {
            ...options,
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1',
                ...(options.env || {})
            }
        };

        logInfo(`Executing Python script: ${pythonBinary} ${fullArgs.map(arg => arg.replace(/,/g, ',\n')).join('\n')}`,
               { scriptPath: absScriptPath, args, options: spawnOptions, timeout });

        const origin = path.basename(absScriptPath);
        const startTime = Date.now();

        const child = this.spawnPythonProcess(pythonBinary, fullArgs, spawnOptions, origin, timeout, commandStr);

        child.once('exit', () => {
            const settings = vsCodeSettingsManager.getSettings();
            const soundPath = settings.processSoundPath?.trim();
            const soundDelay = settings.processSoundDelay;

            if (soundPath && soundDelay > 0) {
                const elapsedMs = Date.now() - startTime;
                if (elapsedMs >= soundDelay) {
                    this.playCompletionSound(soundPath);
                }
            }
        });

        return child;
    }

    public spawnPythonProcess(
        pythonBinary: string,
        args: string[],
        options: childProcess.SpawnOptions = {},
        origin?: string,
        timeout?: number,
        command?: string
    ): childProcess.ChildProcess {
        const child = childProcess.spawn(pythonBinary, args, options);
        let cmd = command;
        if (!cmd) {
            const formattedArgs = args.map(escapeBashArg);
            cmd = `${pythonBinary} ${formattedArgs.join(' ')}`;
        }
        this.registerProcess(child, origin, timeout, cmd);
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
                // Process dead
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
                // Process dead
            }
        }

        const storedPids = this.getActivePids();
        for (const pid of storedPids) {
            try {
                process.kill(pid, signal);
            } catch (err) {
                // Process dead
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
            // Directory read error
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
            // Directory read error
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
