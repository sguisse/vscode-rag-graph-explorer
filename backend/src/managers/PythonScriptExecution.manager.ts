'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import { getWorkspaceExtentionPath } from'../utils/utils-vscode';

const PID_PYTHON_PATH_LOCATION = 'pids_python';

/**
 * Manages Python script execution instances and persists active process PIDs
 * in individual files on disk to eliminate JSON file lock and concurrency issues.
 */
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
     * Registers an active process in memory and creates an individual PID file on disk.
     */
    public registerProcess(child: childProcess.ChildProcess): number | undefined {
        const pid = child.pid;
        if (!pid) return undefined;

        this.activeProcesses.set(pid, child);
        this.ensureDirExists();

        try {
            fs.writeFileSync(this.getPidFilePath(pid), String(pid), 'utf-8');
        } catch (err) {
            // Ignore file write issues
        }

        const cleanup = () => {
            this.unregisterPid(pid);
        };

        child.once('exit', cleanup);
        child.once('error', cleanup);

        return pid;
    }

    /**
     * Unregisters a process PID from memory and removes its individual PID file on disk.
     */
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
     * Executes a Python script file directly, resolving platform binary and tracking PID.
     * @param scriptPath Path to the target Python script.
     * @param args Array of command-line arguments to pass to the script.
     * @param options ChildProcess spawn options.
     */
    public executeScript(
        scriptPath: string,
        args: string[] = [],
        options: childProcess.SpawnOptions = {}
    ): childProcess.ChildProcess {
        const isWindows = process.platform === 'win32';
        const pythonBinary = isWindows ? 'python' : 'python3';
        const fullArgs = [scriptPath, ...args];
        return this.spawnPythonProcess(pythonBinary, fullArgs, options);
    }

    /**
     * Spawns a Python script process and tracks its PID on disk and in memory.
     */
    public spawnPythonProcess(
        pythonBinary: string,
        args: string[],
        options: childProcess.SpawnOptions = {}
    ): childProcess.ChildProcess {
        const child = childProcess.spawn(pythonBinary, args, options);
        this.registerProcess(child);
        return child;
    }

    /**
     * Kills a specific running process by PID.
     */
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
                // Process already dead or missing permissions
            }
        }

        this.unregisterPid(pid);
        return killed;
    }

    /**
     * Terminate all recorded Python process instances from memory and disk files.
     */
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

    /**
     * Purges stale PID files for processes that are no longer active in the OS.
     */
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

    /**
     * Retrieves all active process PIDs currently stored on disk.
     */
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

    /**
     * Checks if a process with given PID is currently active.
     */
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
