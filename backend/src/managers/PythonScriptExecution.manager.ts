'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import { getWorkspaceExtentionPath } from '../utils/utils-vscode';
import { logInfo, log } from '../utils/utils-log';

const PID_PYTHON_PATH_LOCATION = 'pids_python';

export class PythonScriptExecutionManager {
    private static instance: PythonScriptExecutionManager;
    private pidsDir: string;
    private activeProcesses: Map<number, childProcess.ChildProcess> = new Map();

    private constructor() {
        this.pidsDir = path.join(getWorkspaceExtentionPath(), PID_PYTHON_PATH_LOCATION);
        this.ensureDirExists();
        this.cleanStalePids();
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
     * Registers an active process in memory and creates an individual PID file on disk.
     */
    public registerProcess(child: childProcess.ChildProcess, scriptOrigin?: string): number | undefined {
        const pid = child.pid;
        if (!pid) return undefined;

        this.activeProcesses.set(pid, child);
        this.ensureDirExists();

        try {
            fs.writeFileSync(this.getPidFilePath(pid), String(pid), 'utf-8');
        } catch (err) {
            // Ignore file write issues
        }

        const origin = scriptOrigin || `PythonProcess[PID:${pid}]`;

        // Route live output streams
        this.bindStreamLogging(child.stdout, origin);
        this.bindStreamLogging(child.stderr, `${origin}:ERR`);

        const cleanup = () => {
            this.unregisterPid(pid);
        };

        child.once('exit', (code, signal) => {
            log(origin, `Process exited with code ${code ?? 'N/A'}${signal ? ` (signal: ${signal})` : ''}`);
            cleanup();
        });

        child.once('error', (err) => {
            log(`${origin}:ERR`, `Process error: ${err.message}`, err);
            cleanup();
        });

        return pid;
    }

    public unregisterPid(pid: number): void {
        this.activeProcesses.delete(pid);
        const pidFile = this.getPidFilePath(pid);
        if (fs.existsSync(pidFile)) {
            try {
                fs.unlinkSync(pidFile);
            } catch (err) {
                // Ignore file deletion errors
            }
        }
    }

    /**
     * Executes a Python script file directly with forced unbuffered stdio (PYTHONUNBUFFERED=1).
     */
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
            this.activeProcesses.delete(pid);
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
        this.activeProcesses.clear();

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
