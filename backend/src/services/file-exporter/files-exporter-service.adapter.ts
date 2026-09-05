import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo, logError, logWarn } from '../../utils/utils-log';
import { getWorkspaceRoot } from '../../utils/utils-vscode';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';
import { serviceRegistry } from '../../core/ServiceRegistry';
import { ServiceEnum } from '../../../../shared/config/service-enum.gen';
import { IFilesExporterServicePort } from '../../../../shared/services/file-exporter/port-out/file-exporter-service.port';
import { IFilesExporterHistoryServicePort } from '../../../../shared/services/file-exporter/port-out/fe-history-service.port';
import { callFileExporterScript } from '../_python-scripts/file-exporter-py.service';
import { callCopyFilesToClipboardScript } from '../_python-scripts/copy-files-to-clipboard-py.service';
import { getFormattedTimestamp } from '../../utils/utils-datetime';
import {
  FilesExporterInitialState,
  FilesExporterRunRequest,
  FilesExporterRunResponse,
  FilesExporterStatus,
  FilesExporterResult,
  FilterSimulationRequest,
  FilterSimulationResult,
  GeneratedFilesFilterRequest,
  GeneratedFilesFilterResult,
  DestinationActionResult,
  ClipboardActionResult,
  ExportConfig,
  ExportReportEnvelope,
  FilesExporterNotificationType,
} from '../../../../shared/services/file-exporter/model/file-exporter-model';

export class FilesExporterAdapter extends AbstractServiceAdapter implements IFilesExporterServicePort, vscode.Disposable {
  private selectedPathsState: string[] = [];

  constructor() {
    super();
  }

  private getHistoryService(): IFilesExporterHistoryServicePort {
    return serviceRegistry.get(ServiceEnum.FILES_EXPORTER_HISTORY);
  }

  private getWorkspaceRootPath(): string {
    return getWorkspaceRoot() || os.homedir();
  }

  private getRepoName(): string {
    const wsPath = this.getWorkspaceRootPath();
    try {
      const gitRoot = execSync('git rev-parse --show-toplevel', { cwd: wsPath, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
      return path.basename(gitRoot);
    } catch {
      return path.basename(wsPath);
    }
  }

  public async getInitialState(pendingPaths?: string[]): Promise<FilesExporterInitialState> {
    const workspacePath = this.getWorkspaceRootPath();
    const currentRepo = this.getRepoName();
    const settings = vsCodeSettingsManager.getSettings();
    const expSettings = settings.exporter;

    const defaultConfig: ExportConfig = {
      src: workspacePath,
      dest: path.join(workspacePath, 'exported-files'),
      format: (expSettings.defaultFormat as any) || 'yaml',
      max_file: String(expSettings.maxFileSizeKb ?? 50),
      max_chunk: String(expSettings.maxChunkSizeKb ?? 0),
      groupByExt: Boolean(expSettings.splitChunkByFileExtension),
      copyGeneratedFilesToClipboard: Boolean(expSettings.copyGeneratedFilesToClipboard),
      generateTreeView: Boolean(expSettings.generateTreeView),
      logConsole: Boolean(expSettings.generateLogConsole),
      logFile: Boolean(expSettings.generateLogFile),
      inc_paths: expSettings.includePathsRegex || '.*',
      exc_paths: expSettings.excludePathsRegex || '',
      inc_ext: expSettings.includeExtensionsRegex || '',
      exc_ext: expSettings.excludeExtensionsRegex || '',
    };

    const historyWrapper = await this.getHistoryService().getFullWrapper(currentRepo);
    const history = historyWrapper.history || [];
    const repoEntry = historyWrapper.config?.repo?.find((r: any) => r.repo === currentRepo);
    const historyViewMode = repoEntry?.historyViewMode || 'scope-current-repo';
    const lastRunId = repoEntry?.lastRunConfigId || 'default';

    let currentConfig = defaultConfig;
    let selectedId = 'default';

    if (lastRunId !== 'default') {
      const found = history.find((h) => h.id === lastRunId);
      if (found) {
        selectedId = lastRunId;
        currentConfig = found.config;
      }
    }

    const pending = pendingPaths && pendingPaths.length > 0 ? pendingPaths : this.selectedPathsState;

    return {
      defaultConfig,
      currentConfig,
      history,
      selectedId,
      historyViewMode,
      currentRepo,
      workspaceRoot: workspacePath,
      exchange: (expSettings.exchange as any) || [],
      fileExtsCategoryGroups: (expSettings.fileExtsCategoryGroups as any) || [],
      osHome: os.homedir(),
      pendingPaths: pending,
    };
  }

  public async runExport(request: FilesExporterRunRequest): Promise<FilesExporterRunResponse> {
    try {
      logInfo('[FilesExporterAdapter] Starting runExport request...', { request });
      const timestamp = getFormattedTimestamp();
      const rootPath = this.getWorkspaceRootPath();

      const srcPaths = request.paths && request.paths.length > 0
        ? request.paths
        : request.config.src.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

      const absSources = srcPaths.map((p) => (path.isAbsolute(p) ? p : path.join(rootPath, p)));
      let absDest = request.config.dest || path.join(rootPath, 'exported-files');
      if (!path.isAbsolute(absDest)) {
        absDest = path.join(rootPath, absDest);
      }

      logInfo(`[FilesExporterAdapter] Resolved sources: ${absSources.join(', ')} -> Dest: ${absDest}`);

      const exportArgs = {
        paths: absSources,
        timestamp,
        destDir: absDest,
        format: request.config.format,
        mode: request.mode || 'standard',
        maxFile: request.config.max_file,
        maxChunk: request.config.max_chunk,
        groupByExt: request.config.groupByExt,
        logConsole: request.config.logConsole,
        logFile: request.config.logFile,
        generateTreeView: request.config.generateTreeView,
        incPaths: request.config.inc_paths,
        excPaths: request.config.exc_paths,
        incExts: request.config.inc_ext,
        excExts: request.config.exc_ext,
      };

      logInfo('[FilesExporterAdapter] Calling callFileExporterScript...');
      const pythonScriptStatus = await callFileExporterScript(exportArgs as any);
      logInfo(`[FilesExporterAdapter] Python script status returned PID: ${pythonScriptStatus.pid}`);

      const repo = this.getRepoName();
      logInfo(`[FilesExporterAdapter] Saving history for repo: ${repo}...`);
      let historyResult;
      try {
        historyResult = await this.getHistoryService().saveHistory(
          request.config,
          request.currentHistoryId,
          repo
        );
      } catch (histErr) {
        logWarn('[FilesExporterAdapter] Non-fatal: History save failed:', histErr);
      }

      const command = `python3 files-exporter.py --src '${absSources.join(',')}' --dest '${absDest}' --format '${request.config.format}'`;

      return {
        exportDirectory: absDest,
        timestamp,
        command,
        pythonScriptStatus,
        historyResult,
      };
    } catch (error: any) {
      logError('[FilesExporterAdapter] Fatal error in runExport:', error);
      throw new Error(`[FilesExporterAdapter] runExport failed: ${error?.message || error}`);
    }
  }

  public async getExportStatus(pid: number): Promise<FilesExporterStatus> {
    const status = pythonScriptExecutionManager.getProcessStatus(pid || 0);
    if (!status) {
      throw new Error(`Process with PID ${pid} does not exist.`);
    }

    return {
      pythonScriptStatus: status,
      stdout: '',
      stderr: status.message || '',
    };
  }

  public async getExportResult(pid: number, exportDirectory: string, timestamp: string): Promise<FilesExporterResult> {
    const reportFilePath = path.join(exportDirectory, `export-${timestamp}-report.json`);
    if (!fs.existsSync(reportFilePath)) {
      throw new Error(`Report file not found at path: ${reportFilePath}`);
    }

    const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
    const report: ExportReportEnvelope = JSON.parse(reportContent);

    const treePath = path.join(exportDirectory, `export-${timestamp}-tree.json`);
    if (fs.existsSync(treePath)) {
      try {
        report.results.tree_manifest = JSON.parse(fs.readFileSync(treePath, 'utf-8'));
      } catch {}
    }

    const exportsList = report.results.generated_files?.exports || [];
    let estimatedInputTokens = 0;

    for (const filePath of exportsList) {
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const words = content.trim().split(/\s+/).length;
          const chars = content.length;
          estimatedInputTokens += Math.max(1, Math.ceil((words * 1.3 + chars / 4) / 2));
        } catch {}
      }
    }

    return {
      pid,
      exportDirectory,
      timestamp,
      report,
      generatedFiles: report.results.generated_files || { exports: [], logs: [], reports: [] },
      estimatedInputTokens,
    };
  }

  public async killExport(pid: number): Promise<boolean> {
    return pythonScriptExecutionManager.killPid(pid);
  }

  public async simulateFilters(request: FilterSimulationRequest): Promise<FilterSimulationResult> {
    const workspaceRoot = this.getWorkspaceRootPath();
    const scriptPath = path.join(workspaceRoot, vsCodeSettingsManager.getSettings().backendWorkspacePath, 'scripts', 'codebase_exporter', 'files-exporter.py');

    const cleanFilters = (val: string) => val.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).join(',');

    const args: string[] = ['--mode', 'filter-check', '--paths-to-check', request.input];
    if (request.incPaths) args.push('--inc-paths', cleanFilters(request.incPaths));
    if (request.excPaths) args.push('--exc-paths', cleanFilters(request.excPaths));
    if (request.incExts) args.push('--inc-ext', cleanFilters(request.incExts));
    if (request.excExts) args.push('--exc-ext', cleanFilters(request.excExts));

    try {
      const child = pythonScriptExecutionManager.executeScript(scriptPath, args);
      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (d: any) => (stdout += d.toString()));
      child.stderr?.on('data', (d: any) => (stderr += d.toString()));

      const code = await new Promise<number | null>((resolve) => {
        child.on('close', (c) => resolve(c));
      });

      return {
        code: code ?? 2,
        isMatched: code === 0,
        reason: stdout.trim() || stderr.trim() || 'Filter check complete',
        stdout,
        stderr,
      };
    } catch (err: any) {
      return {
        code: 2,
        isMatched: false,
        reason: err?.message || 'Simulator execution error',
        stdout: '',
        stderr: String(err),
      };
    }
  }

  public async getOpenEditorFiles(currentPaths: string[]): Promise<string[]> {
    const openFiles: string[] = [...currentPaths];
    vscode.window.tabGroups.all.forEach((group) => {
      group.tabs.forEach((tab) => {
        if (tab.input instanceof vscode.TabInputText) {
          const fsPath = tab.input.uri.fsPath;
          if (!openFiles.includes(fsPath)) openFiles.push(fsPath);
        }
      });
    });
    this.selectedPathsState = openFiles;
    return openFiles;
  }

  public async getGitDiffFiles(currentPaths: string[]): Promise<string[]> {
    const gitService = serviceRegistry.get(ServiceEnum.GIT);
    const wsPath = this.getWorkspaceRootPath();
    const result = await gitService.getLocalModifiedFilesFromLastCommit(wsPath);

    if (!result.success || !result.files) {
      return currentPaths;
    }

    const merged = [...currentPaths];
    result.files.forEach((p) => {
      if (!merged.includes(p)) merged.push(p);
    });

    this.selectedPathsState = merged;
    return merged;
  }

  public async syncSelectedPaths(paths: string[]): Promise<void> {
    this.selectedPathsState = paths || [];
  }

  public async getSelectedPaths(): Promise<string[]> {
    return this.selectedPathsState;
  }

  public async clearSelectedPaths(): Promise<void> {
    this.selectedPathsState = [];
  }

  public async openPathAtCursor(targetPath: string, lineNum?: number): Promise<void> {
    if (!targetPath || !targetPath.trim()) return;

    const wsPath = this.getWorkspaceRootPath();
    let cleanPath = targetPath.replace(/^['"]|['"]$/g, '').trim();
    if (!path.isAbsolute(cleanPath)) {
      cleanPath = path.join(wsPath, cleanPath);
    }

    if (!fs.existsSync(cleanPath)) {
      vscode.window.showWarningMessage(`The path '${targetPath}' does not exist.`);
      return;
    }

    const stat = fs.statSync(cleanPath);
    if (stat.isDirectory()) {
      await vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(cleanPath));
    } else {
      const doc = await vscode.workspace.openTextDocument(cleanPath);
      await vscode.window.showTextDocument(doc);
    }
  }

  public async copyLatestExportedFiles(destDir: string): Promise<DestinationActionResult> {
    const targetDir = destDir || path.join(this.getWorkspaceRootPath(), 'exported-files');
    if (!fs.existsSync(targetDir)) {
      return { success: false, message: 'No files to copy, execute an export first!' };
    }

    const files = fs.readdirSync(targetDir);
    let maxTimestamp = '';
    const fileTimestamps: { file: string; timestamp: string }[] = [];

    for (const file of files) {
      if (file.endsWith('.log') || file.endsWith('-report.json') || file.endsWith('-tree.json')) continue;
      const match = file.match(/^export-(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
      if (match) {
        const ts = match[1];
        fileTimestamps.push({ file, timestamp: ts });
        if (ts > maxTimestamp) maxTimestamp = ts;
      }
    }

    const latestFiles = fileTimestamps.filter((f) => f.timestamp === maxTimestamp).map((f) => path.join(targetDir, f.file));

    if (latestFiles.length === 0) {
      return { success: false, message: 'No files to copy, execute an export first!' };
    }

    await callCopyFilesToClipboardScript(latestFiles);
    return { success: true, message: `Copied ${latestFiles.length} file(s) to OS clipboard.`, files: latestFiles };
  }

  public async copySelectedFilesToClipboard(paths: string[]): Promise<ClipboardActionResult> {
    if (!paths || paths.length === 0) {
      return { success: false, message: 'No files or directories selected.', fileCount: 0 };
    }

    const resolvedFiles: string[] = [];
    let totalSizeBytes = 0;

    const resolveRecursively = (currentPath: string) => {
      if (!fs.existsSync(currentPath)) return;
      const stat = fs.statSync(currentPath);
      if (stat.isFile()) {
        resolvedFiles.push(currentPath);
        totalSizeBytes += stat.size;
      } else if (stat.isDirectory()) {
        const children = fs.readdirSync(currentPath);
        children.forEach((c) => resolveRecursively(path.join(currentPath, c)));
      }
    };

    paths.forEach(resolveRecursively);

    if (resolvedFiles.length === 0) {
      return { success: false, message: 'No files discovered within selected paths.', fileCount: 0 };
    }

    const FIVE_MB = 5 * 1024 * 1024;
    if (resolvedFiles.length > 50 || totalSizeBytes > FIVE_MB) {
      return {
        success: false,
        message: `Payload large: ${resolvedFiles.length} files totaling ${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB.`,
        fileCount: resolvedFiles.length,
        totalSizeBytes,
        requiresConfirmation: true,
      };
    }

    await callCopyFilesToClipboardScript(resolvedFiles);
    return {
      success: true,
      message: `Successfully copied ${resolvedFiles.length} file(s) to clipboard.`,
      fileCount: resolvedFiles.length,
      totalSizeBytes,
      files: resolvedFiles,
    };
  }

  public async clearDestDirectory(destDir: string): Promise<DestinationActionResult> {
    const targetDir = destDir || path.join(this.getWorkspaceRootPath(), 'exported-files');
    if (!fs.existsSync(targetDir)) {
      return { success: false, message: 'Destination directory does not exist or is empty.' };
    }

    const files = fs.readdirSync(targetDir);
    for (const f of files) {
      fs.rmSync(path.join(targetDir, f), { recursive: true, force: true });
    }

    return { success: true, message: 'Destination directory contents successfully cleared.' };
  }

  public async applyFileFilter(request: GeneratedFilesFilterRequest): Promise<GeneratedFilesFilterResult> {
    let filtered = [...request.files];

    if (request.fileNameRegex && request.fileNameRegex.trim()) {
      const reg = new RegExp(request.fileNameRegex.trim(), 'i');
      filtered = filtered.filter((f) => reg.test(path.basename(f)));
    }

    if (request.fileContentRegex && request.fileContentRegex.trim()) {
      const reg = new RegExp(request.fileContentRegex.trim(), 'i');
      filtered = filtered.filter((f) => {
        const fullPath = path.isAbsolute(f) ? f : path.join(request.destDir, f);
        if (fs.existsSync(fullPath)) {
          try {
            return reg.test(fs.readFileSync(fullPath, 'utf-8'));
          } catch {
            return false;
          }
        }
        return false;
      });
    }

    return { files: filtered };
  }

  public async openBrowserTab(url: string, openInVSCode?: boolean): Promise<void> {
    if (openInVSCode === false) {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    } else {
      await vscode.commands.executeCommand('simpleBrowser.show', url);
    }
  }

  public async showNotification(type: FilesExporterNotificationType, text: string): Promise<void> {
    if (type === 'error') vscode.window.showErrorMessage(text);
    else if (type === 'warn') vscode.window.showWarningMessage(text);
    else vscode.window.showInformationMessage(text);
  }

  public dispose() {}
}
