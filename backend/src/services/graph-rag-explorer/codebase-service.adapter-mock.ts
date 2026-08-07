
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';

import { CodebaseData, ICodebaseServicePort } from '../../../../shared/services/graph-rag-explorer';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { initialCodebase, FOLDER_POSITIONS, JSON_SCHEMA_SPEC } from './data/codebase.data';
import { serviceRegistry } from '../../core/ServiceRegistry';
import { ServiceEnum } from '../../../../shared/config/service-enum.gen';
import { IGraphRagInstallerServicePort } from '../../../../shared/services/graph-rag-explorer/domain/port-out/installer-service.port';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { EXTENSION_BASE_CONFIG_NAME } from '../../extension';

let activeChildProcess: any = null;

export class CodebaseMockAdapter extends AbstractServiceAdapter implements ICodebaseServicePort, vscode.Disposable {
  private currentCodebase: CodebaseData = initialCodebase;
  private graphRagInstallerService: IGraphRagInstallerServicePort ;

constructor() {
    super();
    this.graphRagInstallerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_INSTALLER);
}

  public async getCodebase(): Promise<CodebaseData> {
    return this.currentCodebase;
  }

  public async importCodebase(data: CodebaseData): Promise<void> {
    if (!data || !Array.isArray(data.files) || !Array.isArray(data.dependencies)) {
      throw new Error("Invalid AST data schema: must contain 'files' and 'dependencies' arrays");
    }
    this.currentCodebase = data;
  }

  public async getFolderPositions(): Promise<Record<string, { label: string }>> {
    return FOLDER_POSITIONS;
  }

  public async getJsonSchemaSpec(): Promise<unknown> {
    return JSON_SCHEMA_SPEC;
  }


  public async runPythonScan (mode: string, targetFile: string = "") {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return;

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const backendScriptsPath : string = vsCodeSettingsManager.getSettings().backendWorkspacePath;
    const targetDir4Scripts = path.join(workspaceRoot, backendScriptsPath, "scripts");

    //this.graphRagInstallerService.copyScripts();
    this.postMessage("updateStatus", "building");

    const parseLogLine = (line: string, fallbackLevel: 'debug' | 'info' | 'warn' | 'error') => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        let level = fallbackLevel;
        if (cleanLine.includes("🪲") || cleanLine.includes("[DEBUG]")) level = "debug";
        else if (cleanLine.includes("⚠️") || cleanLine.includes("[WARN]")) level = "warn";
        else if (cleanLine.includes("❌") || cleanLine.includes("[ERROR]")) level = "error";
        else if (cleanLine.includes("ℹ️") || cleanLine.includes("[INFO]") || cleanLine.includes("✅")) level = "info";

        const timestamp = new Date().toLocaleTimeString();

        // Relay background execution logs to the VS Code Output Channel
        //logOutputChannel.appendLine(`[${timestamp}] [${level.toUpperCase()}] ${cleanLine}`);

        this.postMessage(
             "logTrace",
             { level: level, message: cleanLine, timestamp: timestamp }
        );
    };

    const runnerScript = path.join(targetDir4Scripts, "main.py");
    let args = [runnerScript];

    const isWindows = process.platform === 'win32';
    const pythonBinary = isWindows ? 'python' : 'python3';

    const payloadConfig = vsCodeSettingsManager.toJson();
    payloadConfig[EXTENSION_BASE_CONFIG_NAME]["workspaceRoot"] = workspaceRoot;

    if (activeChildProcess) {
        try {
            //logOutputChannel.appendLine('[WARN] Terminating previous background execution context before launching new process.');
            activeChildProcess.kill('SIGKILL');
        } catch(e){}
    }

    //logOutputChannel.appendLine(`[INFO] Spawning Python background process: ${pythonBinary} with script ${runnerScript}`);
    const child = childProcess.spawn(pythonBinary, args, { cwd: workspaceRoot });
    activeChildProcess = child;

    child.stdin.write(JSON.stringify(payloadConfig));
    child.stdin.end();

    child.stdout.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "info")));
    child.stderr.on("data", (data: any) => data.toString().split("\n").forEach((l: string) => parseLogLine(l, "error")));

    child.on("close", (code: number) => {
        if (activeChildProcess === child) activeChildProcess = null;
        if (code === 0) {
            //logOutputChannel.appendLine('[INFO] Python background process completed successfully.');
            this.postMessage("updateStatus", "ready");
            const finalUiPayloadPath = path.join(workspaceRoot, backendScriptsPath, "target", "ui_outputs", "graph-ui-payload.json");
            if (fs.existsSync(finalUiPayloadPath)) {
                try {
                    const rawPayload = JSON.parse(fs.readFileSync(finalUiPayloadPath, "utf-8"));
                    this.postMessage("updateGraphData", rawPayload.graph);
                } catch (err) {
                    //logOutputChannel.appendLine(`[ERROR] Failed to parse UI payload JSON structure: ${err}`);
                }
            }
        } else {
            //logOutputChannel.appendLine(`[ERROR] Python background process exited with non-zero exit code: ${code}`);
            this.postMessage("updateStatus", "error");
        }
    });
  }


  public dispose() {
  }

}
