import { execFile } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

export class PythonService {
    constructor(private extensionUri: vscode.Uri) {}

    public executeScript(scriptName: string, args: string[], onLog: (data: string, isError: boolean) => void): Promise<string> {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(this.extensionUri.fsPath, 'scripts', scriptName);
            const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
            const processChild = execFile(pythonCommand, [scriptPath, ...args]);

            let stdoutData = '';

            processChild.stdout?.on('data', (chunk) => {
                const text = chunk.toString();
                stdoutData += text;
                onLog(text, false);
            });

            processChild.stderr?.on('data', (chunk) => {
                onLog(chunk.toString(), true);
            });

            processChild.on('close', (code) => {
                if (code === 0) {
                    resolve(stdoutData.trim());
                } else {
                    reject(new Error(`Python script exited with code: ${code}`));
                }
            });
        });
    }
}
