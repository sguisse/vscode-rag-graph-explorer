#!/usr/bin/env bash
set -e

mkdir -p backend/src/services/file-exporter/delegate

# 1. Create the refactored delegate with modular helper functions
cat << 'EOF' > backend/src/services/file-exporter/delegate/execute-bash-codebase-update.delegate.ts
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { logInfo } from '../../../utils/utils-log';
import { BashExecutionResult } from '../../../../../shared/services/file-exporter/model/file-exporter-model';

function cleanPath(p: string): string {
  let cleaned = p.trim().replace(/^['"]|['"]$/g, '').replace(/:\s*$/, '').trim();
  if (cleaned.startsWith('./')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

function extractPathInQuotes(line: string): string | null {
  const match = line.match(/['"]([^'"]+)['"]/);
  if (match && match[1]) {
    return cleanPath(match[1]);
  }
  return null;
}

function getGitStatusPorcelain(wsPath: string): string {
  try {
    return execSync('git status --porcelain', {
      cwd: wsPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

function executeScriptFile(scriptPath: string, wsPath: string): { terminalLogs: string; execError: boolean } {
  try {
    const output = execSync(`bash "${scriptPath}"`, {
      cwd: wsPath,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return { terminalLogs: output, execError: false };
  } catch (err: any) {
    const logs = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + (err.message || '');
    return { terminalLogs: logs, execError: true };
  }
}

function parseImpactedPathsFromLogs(terminalLogs: string): {
  created: Set<string>;
  updated: Set<string>;
  removed: Set<string>;
} {
  const created = new Set<string>();
  const updated = new Set<string>();
  const removed = new Set<string>();

  const logLines = terminalLogs.split('\n');
  logLines.forEach((line) => {
    const cleanLine = line.trim();
    if (!cleanLine) return;

    const pathInQuotes = extractPathInQuotes(cleanLine);

    if (cleanLine.includes('➕ Creating') || cleanLine.includes('Creating')) {
      const p = pathInQuotes || cleanPath(cleanLine.replace(/.*(?:➕\s*)?Creating:?\s*/, ''));
      if (p && !p.startsWith('http') && !p.includes('...')) created.add(p);
    } else if (cleanLine.includes('✏️ Modifying') || cleanLine.includes('Modifying') || cleanLine.includes('Updated')) {
      const p = pathInQuotes || cleanPath(cleanLine.replace(/.*(?:✏️\s*)?(?:Modifying|Updated):?\s*/, ''));
      if (p && !p.startsWith('http') && !p.includes('...')) updated.add(p);
    } else if (
      cleanLine.includes('🗑️ Deleting') ||
      cleanLine.includes('🗑️ Removing') ||
      cleanLine.includes('Deleting') ||
      cleanLine.includes('Removing') ||
      cleanLine.includes('Removed')
    ) {
      const p = pathInQuotes || cleanPath(cleanLine.replace(/.*(?:🗑️\s*)?(?:Deleting|Removing|Removed):?\s*/, ''));
      if (p && !p.startsWith('http') && !p.includes('...')) removed.add(p);
    }
  });

  return { created, updated, removed };
}

function parseImpactedPathsFromGitDiff(
  gitStatusBefore: string,
  gitStatusAfter: string,
  created: Set<string>,
  updated: Set<string>,
  removed: Set<string>
): void {
  if (!gitStatusAfter) return;

  const beforeLines = new Set(gitStatusBefore.split('\n').map((l) => l.trim()).filter(Boolean));
  const afterLines = gitStatusAfter.split('\n').map((l) => l.trim()).filter(Boolean);

  const newGitLines = afterLines.filter((l) => !beforeLines.has(l));
  for (const line of newGitLines) {
    const statusCode = line.substring(0, 2);
    const relPath = cleanPath(line.substring(2));
    if (relPath && relPath !== 'update_codebase_with_llm_result.sh') {
      if (statusCode.includes('?') || statusCode.includes('A')) {
        created.add(relPath);
      } else if (statusCode.includes('M')) {
        updated.add(relPath);
      } else if (statusCode.includes('D')) {
        removed.add(relPath);
      }
    }
  }
}

function parseImpactedPathsFromBashFallback(
  bash: string,
  wsPath: string,
  created: Set<string>,
  updated: Set<string>,
  removed: Set<string>
): void {
  if (created.size > 0 || updated.size > 0 || removed.size > 0) return;

  const catRegex = /cat\s+<<\s*['"]?(\w+)['"]?\s*>\s*['"]?([a-zA-Z0-9_.\-\/]+)['"]?/g;
  let match: RegExpExecArray | null;
  while ((match = catRegex.exec(bash)) !== null) {
    const targetFile = cleanPath(match[2]);
    if (targetFile && targetFile !== 'update_codebase_with_llm_result.sh') {
      const abs = path.isAbsolute(targetFile) ? targetFile : path.join(wsPath, targetFile);
      if (fs.existsSync(abs)) {
        updated.add(targetFile);
      } else {
        created.add(targetFile);
      }
    }
  }

  const rmRegex = /rm\s+(-[rf]+\s+)?['"]?([a-zA-Z0-9_.\-\/]+)['"]?/g;
  while ((match = rmRegex.exec(bash)) !== null) {
    const targetFile = cleanPath(match[2]);
    if (targetFile && targetFile !== 'update_codebase_with_llm_result.sh') {
      removed.add(targetFile);
    }
  }
}

function extractCommitFromLine(line: string): string {
  const echoMatch = line.match(/^echo\s+["']?([^"']+)["']?$/i);
  if (echoMatch) {
    const msg = echoMatch[1].trim();
    if (
      msg.includes('✅') ||
      msg.includes('🐛') ||
      msg.includes('✨') ||
      msg.toLowerCase().startsWith('feat') ||
      msg.toLowerCase().startsWith('fix')
    ) {
      return msg;
    }
  }
  const commitMatch = line.match(/git\s+commit\s+-m\s+["']([^"']+)["']/i);
  if (commitMatch) {
    return commitMatch[1].trim();
  }
  if (line.includes('✅') || line.includes('🐛') || line.includes('✨')) {
    return line.replace(/^echo\s+/, '').replace(/^["']|["']$/g, '').trim();
  }
  return '';
}

function extractGitCommitMessage(terminalLogs: string, bash: string): string {
  const logLines = terminalLogs.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = logLines.length - 1; i >= 0; i--) {
    const msg = extractCommitFromLine(logLines[i]);
    if (msg) {
      return msg;
    }
  }

  const scriptLines = bash.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = scriptLines.length - 1; i >= 0; i--) {
    const msg = extractCommitFromLine(scriptLines[i]);
    if (msg) {
      return msg;
    }
  }

  return '';
}

export async function executeBashCodebaseUpdateDelegate(
  bash: string,
  wsPath: string
): Promise<BashExecutionResult> {
  const scriptPath = path.join(wsPath, 'update_codebase_with_llm_result.sh');
  logInfo(`[executeBashCodebaseUpdateDelegate] starting... (${bash.length} chars)`);

  fs.writeFileSync(scriptPath, bash, { encoding: 'utf8', mode: 0o755 });

  const gitStatusBefore = getGitStatusPorcelain(wsPath);
  const { terminalLogs, execError } = executeScriptFile(scriptPath, wsPath);

  const { created, updated, removed } = parseImpactedPathsFromLogs(terminalLogs);

  const gitStatusAfter = getGitStatusPorcelain(wsPath);
  parseImpactedPathsFromGitDiff(gitStatusBefore, gitStatusAfter, created, updated, removed);
  parseImpactedPathsFromBashFallback(bash, wsPath, created, updated, removed);

  const filePathsCreated = Array.from(created);
  const filePathsUpdated = Array.from(updated);
  const filePathsRemoved = Array.from(removed);

  const gitCommitMessage = extractGitCommitMessage(terminalLogs, bash);

  let result: 'success' | 'failed' | 'warning' = 'success';
  let message = 'Bash script executed successfully.';

  if (execError) {
    result = 'failed';
    message = 'Bash script execution failed with errors.';
  } else if (filePathsCreated.length === 0 && filePathsUpdated.length === 0 && filePathsRemoved.length === 0) {
    result = 'warning';
    message = 'Bash script executed, but no file paths were modified, created, or removed.';
  } else {
    message = `Bash script executed successfully. ${filePathsCreated.length} file(s) created, ${filePathsUpdated.length} file(s) updated, ${filePathsRemoved.length} file(s) removed.`;
  }

  return {
    terminalLogs,
    result,
    message,
    filePathsUpdated,
    filePathsCreated,
    filePathsRemoved,
    gitCommitMessage,
  };
}
EOF

# 2. Update FileExporterAdapter to call delegate
cat << 'EOF' > backend/src/services/file-exporter/file-exporter-service.adapter.ts
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
import { IFileExporterServicePort } from '../../../../shared/services/file-exporter/port-out/file-exporter-service.port';
import { IFileExporterHistoryServicePort } from '../../../../shared/services/file-exporter/port-out/file-exporter-history-service.port';
import { callFileExporterScript } from '../_python-scripts/file-exporter-py.service';
import { callCopyFilesToClipboardScript } from '../_python-scripts/copy-files-to-clipboard-py.service';
import { getFormattedTimestamp } from '../../utils/utils-datetime';
import { executeBashCodebaseUpdateDelegate } from './delegate/execute-bash-codebase-update.delegate';
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
  BashExecutionResult,
} from '../../../../shared/services/file-exporter/model/file-exporter-model';

export class FileExporterAdapter extends AbstractServiceAdapter implements IFileExporterServicePort, vscode.Disposable {
  private selectedPathsState: string[] = [];

  constructor() {
    super();
  }

  private getHistoryService(): IFileExporterHistoryServicePort {
    return serviceRegistry.get(ServiceEnum.FILE_EXPORTER_HISTORY);
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
      codebase: {
        src: workspacePath,
        max_file: String(expSettings.maxFileSizeKb ?? 50),
        inc_paths: expSettings.includePathsRegex || '.*',
        exc_paths: expSettings.excludePathsRegex || '',
        inc_ext: expSettings.includeExtensionsRegex || '',
        exc_ext: expSettings.excludeExtensionsRegex || '',
      },
      reference: {
        src: '',
        max_file: String(expSettings.maxFileSizeKb ?? 50),
        inc_paths: '.*',
        exc_paths: '',
        inc_ext: '',
        exc_ext: '',
      },
      dest: path.join(workspacePath, 'exported-files'),
      format: (expSettings.defaultFormat as any) || 'yaml',
      max_chunk: String(expSettings.maxChunkSizeKb ?? 0),
      groupByExt: Boolean(expSettings.splitChunkByFileExtension),
      copyGeneratedFilesToClipboard: Boolean(expSettings.copyGeneratedFilesToClipboard),
      generateTreeView: Boolean(expSettings.generateTreeView),
      logConsole: Boolean(expSettings.generateLogConsole),
      logFile: Boolean(expSettings.generateLogFile),
      generatePromptFile: Boolean((expSettings as any).generatePromptFile ?? true),
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
      logInfo('[FileExporterAdapter] Starting runExport request...', { request });
      const timestamp = getFormattedTimestamp();
      const rootPath = this.getWorkspaceRootPath();

      const codebaseSrcPaths = request.codebasePaths && request.codebasePaths.length > 0
        ? request.codebasePaths
        : (request.config.codebase?.src || '').split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

      const referenceSrcPaths = request.referencePaths && request.referencePaths.length > 0
        ? request.referencePaths
        : (request.config.reference?.src || '').split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

      const absCodebase = codebaseSrcPaths.map((p) => (path.isAbsolute(p) ? p : path.join(rootPath, p)));
      const absReferences = referenceSrcPaths.map((p) => (path.isAbsolute(p) ? p : path.join(rootPath, p)));

      let absDest = request.config.dest || path.join(rootPath, 'exported-files');
      if (!path.isAbsolute(absDest)) {
        absDest = path.join(rootPath, absDest);
      }

      const isPromptActive = request.config.generatePromptFile !== false;
      const rawPrompt = request.config.prompt || (request as any).prompt || '';
      const resolvedPrompt = isPromptActive ? rawPrompt : '';

      logInfo('[FileExporterAdapter] Prompt Resolution:', {
        configGeneratePromptFile: request.config.generatePromptFile,
        isPromptActive,
        rawPromptLength: rawPrompt.length,
        resolvedPromptLength: resolvedPrompt.length,
      });

      const exportArgs = {
        config: { ...request.config, generatePromptFile: isPromptActive, prompt: resolvedPrompt },
        paths: absCodebase,
        referencePaths: absReferences,
        prompt: resolvedPrompt,
        timestamp,
        destDir: absDest,
        format: request.config.format,
        mode: request.mode || 'standard',
        maxChunk: request.config.max_chunk,
        groupByExt: request.config.groupByExt,
        logConsole: request.config.logConsole,
        logFile: request.config.logFile,
        generateTreeView: request.config.generateTreeView,
      };

      const pythonScriptStatus = await callFileExporterScript(exportArgs as any);

      const repo = this.getRepoName();
      let historyResult;
      try {
        historyResult = await this.getHistoryService().saveHistory(
          request.config,
          request.currentHistoryId,
          repo
        );
      } catch (histErr) {
        logWarn('[FileExporterAdapter] Non-fatal: History save failed:', histErr);
      }

      return {
        exportDirectory: absDest,
        timestamp,
        pythonScriptStatus,
        historyResult,
      };
    } catch (error: any) {
      logError('[FileExporterAdapter] Fatal error in runExport:', error);
      throw new Error(`[FileExporterAdapter] runExport failed: ${error?.message || error}`);
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

    const cbTreePath = path.join(exportDirectory, `export-${timestamp}-codebase-tree.json`);
    if (fs.existsSync(cbTreePath) && report.results?.codebase) {
      try {
        report.results.codebase.tree_manifest = JSON.parse(fs.readFileSync(cbTreePath, 'utf-8'));
      } catch {}
    }

    const refTreePath = path.join(exportDirectory, `export-${timestamp}-reference-tree.json`);
    if (fs.existsSync(refTreePath) && report.results?.reference) {
      try {
        report.results.reference.tree_manifest = JSON.parse(fs.readFileSync(refTreePath, 'utf-8'));
      } catch {}
    }

    let estimatedInputTokens = 0;
    const exportsList = [
      ...(report.results?.codebase?.generated_files?.exports || []),
      ...(report.results?.reference?.generated_files?.exports || []),
      ...(report.results?.generated_files?.codebase?.exports || []),
      ...(report.results?.generated_files?.reference?.exports || []),
    ];

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

    const discoveredLogs: string[] = [];
    const discoveredPrompts: string[] = [];

    try {
      if (fs.existsSync(exportDirectory)) {
        const filesInDir = fs.readdirSync(exportDirectory);
        for (const f of filesInDir) {
          const fullPath = path.join(exportDirectory, f);
          if (f.includes(timestamp) || f.startsWith('export-')) {
            if (f.endsWith('.log') || f.includes('log')) {
              discoveredLogs.push(fullPath);
            } else if (f.includes('prompt')) {
              discoveredPrompts.push(fullPath);
            }
          }
        }
      }
    } catch (e) {
      logWarn('[FileExporterAdapter] Non-fatal: Error scanning exportDirectory for logs/prompts:', e);
    }

    const existingLogs = report.results?.generated_files?.logs || [];
    const existingPrompts = report.results?.generated_files?.prompt || [];

    const mergedLogs = Array.from(new Set([...existingLogs, ...discoveredLogs]));
    const mergedPrompts = Array.from(new Set([...existingPrompts, ...discoveredPrompts]));

    const generatedFiles = {
      codebase: report.results?.generated_files?.codebase || { exports: [], reports: [] },
      reference: report.results?.generated_files?.reference || { exports: [], reports: [] },
      logs: mergedLogs,
      prompt: mergedPrompts,
    };

    return {
      pid,
      exportDirectory,
      timestamp,
      report,
      generatedFiles,
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
    if (request.incPaths) args.push('--codebase-inc-paths', cleanFilters(request.incPaths));
    if (request.excPaths) args.push('--codebase-exc-paths', cleanFilters(request.excPaths));
    if (request.incExts) args.push('--codebase-inc-ext', cleanFilters(request.incExts));
    if (request.excExts) args.push('--codebase-exc-ext', cleanFilters(request.excExts));

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

    await callCopyFilesToClipboardScript(resolvedFiles);
    return {
      success: true,
      message: `Successfully copied ${resolvedFiles.length} file(s) to clipboard.`,
      fileCount: resolvedFiles.length,
      totalSizeBytes,
      files: resolvedFiles,
    };
  }

  public async copyFullContextToClipboard(codebasePaths: string[], referencePaths: string[], prompt: string): Promise<ClipboardActionResult> {
    try {
      const timestamp = getFormattedTimestamp();
      const rootPath = this.getWorkspaceRootPath();
      const absDest = path.join(rootPath, 'exported-files');
      if (!fs.existsSync(absDest)) {
        fs.mkdirSync(absDest, { recursive: true });
      }

      const absCodebase = codebasePaths.map((p) => (path.isAbsolute(p) ? p : path.join(rootPath, p)));
      const absReferences = referencePaths.map((p) => (path.isAbsolute(p) ? p : path.join(rootPath, p)));

      const exportArgs = {
        config: { generatePromptFile: true, prompt },
        paths: absCodebase,
        referencePaths: absReferences,
        prompt: prompt,
        timestamp,
        destDir: absDest,
        format: 'yaml',
        mode: 'standard',
        maxChunk: '0',
        groupByExt: false,
        logConsole: true,
        logFile: false,
        generateTreeView: false,
      };

      const pythonScriptStatus = await callFileExporterScript(exportArgs as any);

      if (pythonScriptStatus?.pid) {
        const childProcess = pythonScriptExecutionManager.getProcessInstance(pythonScriptStatus.pid);
        if (childProcess) {
          await new Promise<void>((resolve) => {
            childProcess.once('exit', () => resolve());
            childProcess.once('error', () => resolve());
          });
        }
      }

      const copyResult = await this.copyLatestExportedFiles(absDest);

      return {
        success: copyResult.success,
        message: copyResult.message || 'Exported and copied codebase, reference, and prompt context to clipboard!',
        fileCount: copyResult.files?.length || 0,
      };
    } catch (err: any) {
      logError('[FileExporterAdapter] Error in copyFullContextToClipboard:', err);
      return {
        success: false,
        message: `Failed to copy full context: ${err?.message || err}`,
        fileCount: 0,
      };
    }
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

  public async executeBashCodebaseUpdate(bash: string): Promise<BashExecutionResult> {
    return executeBashCodebaseUpdateDelegate(bash, this.getWorkspaceRootPath());
  }

  public dispose() {}
}
EOF

echo "✅ refactor: Extracted executeBashCodebaseUpdate into delegate execute-bash-codebase-update.delegate.ts with modular helper functions!"
