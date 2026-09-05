import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo, logError, logWarn } from '../../utils/utils-log';
import {
  HistoryEntry,
  ExportConfig,
  HistoryWrapper,
  HistoryViewMode,
  HistorySaveResult,
  HistoryClearRequest,
  HistoryClearResult,
} from '../../../../shared/services/file-exporter/model/file-exporter-model';
import { IFilesExporterHistoryServicePort } from '../../../../shared/services/file-exporter/port-out/fe-history-service.port';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { serviceRegistry } from '../../core/ServiceRegistry';
import { ServiceEnum } from '../../../../shared/config/service-enum.gen';
import { IVsCodeServicePort } from '../../../../shared/services/vscode/port-out/vscode-service.port';

export class FilesExporterHistoryAdapter extends AbstractServiceAdapter implements IFilesExporterHistoryServicePort, vscode.Disposable {
  private getHistoryFilePathResolved(): string {
    const rawPath = vsCodeSettingsManager.getSettings().exporter.historyYamlPath || '~/files-exporter/.files-exporter-history.yaml';
    if (rawPath.startsWith('~')) {
      return path.join(os.homedir(), rawPath.slice(1));
    }
    return rawPath;
  }

  public async getHistoryFilePath(): Promise<string> {
    return this.getHistoryFilePathResolved();
  }

  private getVscodeService(): IVsCodeServicePort {
    return serviceRegistry.get(ServiceEnum.VS_CODE);
  }

  public async getFullWrapper(currentRepo?: string): Promise<HistoryWrapper> {
    const filePath = this.getHistoryFilePathResolved();
    let parsed: any = {};
    if (existsSync(filePath)) {
      try {
        const fileData = await fs.readFile(filePath, 'utf8');
        parsed = JSON.parse(fileData.trim() || '{}');
      } catch (e) {
        logError('[FilesExporterHistoryAdapter] Error parsing history file:', e);
      }
    }

    if (!parsed.config) parsed.config = {};
    if (!parsed.config.repo) parsed.config.repo = [];
    if (!parsed.history) parsed.history = [];

    if (currentRepo) {
      let repoEntry = parsed.config.repo.find((r: any) => r.repo === currentRepo);
      if (!repoEntry) {
        repoEntry = {
          repo: currentRepo,
          lastRunConfigId: parsed.config.lastRunConfigId || 'default',
          historyViewMode: parsed.config.historyViewMode || 'scope-current-repo',
        };
        parsed.config.repo.push(repoEntry);
      }
    }

    return parsed as HistoryWrapper;
  }

  private async writeWrapper(wrapper: any): Promise<void> {
    const filePath = this.getHistoryFilePathResolved();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    wrapper.history = (wrapper.history || []).map((h: any) => ({
      id: h.id,
      repo: h.repo || 'unknown',
      display: h.display,
      frozen: h.frozen || false,
      config: h.config,
    }));
    await fs.writeFile(filePath, JSON.stringify(wrapper, null, 2), 'utf8');
  }

  public async loadHistory(): Promise<HistoryEntry[]> {
    const wrapper = await this.getFullWrapper();
    return wrapper.history;
  }

  public async getLastRunConfigId(repo: string): Promise<string> {
    const wrapper = await this.getFullWrapper(repo);
    const repoEntry = wrapper.config.repo.find((r: any) => r.repo === repo);
    return repoEntry ? repoEntry.lastRunConfigId : 'default';
  }

  public async setHistoryViewMode(mode: HistoryViewMode, repo: string): Promise<void> {
    const wrapper = await this.getFullWrapper(repo);
    const repoEntry = wrapper.config.repo.find((r: any) => r.repo === repo);
    if (repoEntry) {
      repoEntry.historyViewMode = mode;
    }
    await this.writeWrapper(wrapper);
  }

  public async saveHistory(formData: ExportConfig, currentHistoryId: string | undefined, repo: string): Promise<HistorySaveResult> {
    const wrapper = await this.getFullWrapper(repo);
    const uiConfig = formData;

    if (currentHistoryId && currentHistoryId !== 'default') {
      const existingIndex = wrapper.history.findIndex((h: any) => h.id === currentHistoryId);
      if (existingIndex !== -1 && !wrapper.history[existingIndex].frozen) {
        wrapper.history[existingIndex].config = uiConfig;
        const repoEntry = wrapper.config.repo.find((r: any) => r.repo === repo);
        if (repoEntry) {
          repoEntry.lastRunConfigId = currentHistoryId;
        }
        await this.writeWrapper(wrapper);
        return { history: wrapper.history, selectedId: currentHistoryId };
      }
    }

    const finalSelectedId = currentHistoryId || 'default';
    const repoEntry = wrapper.config.repo.find((r: any) => r.repo === repo);
    if (repoEntry) {
      repoEntry.lastRunConfigId = finalSelectedId;
    }

    await this.writeWrapper(wrapper);
    return { history: wrapper.history, selectedId: finalSelectedId };
  }

  public async duplicateEntry(id: string, repo: string): Promise<{ history: HistoryEntry[]; newId: string }> {
    const wrapper = await this.getFullWrapper(repo);
    const target = wrapper.history.find((h: any) => h.id === id);
    if (!target) return { history: wrapper.history, newId: id };

    const newId = new Date().toISOString() + '-copy';
    const newEntry: HistoryEntry = {
      id: newId,
      repo: repo,
      display: `${target.display} copy`,
      frozen: false,
      config: JSON.parse(JSON.stringify(target.config)),
    };

    wrapper.history = [newEntry, ...wrapper.history];
    await this.writeWrapper(wrapper);
    return { history: wrapper.history, newId };
  }

  public async addNewEntry(defaultConfig: ExportConfig, workspaceName: string, repo: string, customName?: string): Promise<{ history: HistoryEntry[]; newId: string }> {
    const wrapper = await this.getFullWrapper(repo);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const displayName = customName || `${pad(now.getMonth() + 1)}/${pad(now.getDate())}-${pad(now.getHours())}:${pad(now.getMinutes())} --> ${workspaceName} --> ⚙️ New config`;

    const newId = now.toISOString();
    const newEntry: HistoryEntry = {
      id: newId,
      repo: repo,
      display: displayName,
      frozen: false,
      config: JSON.parse(JSON.stringify(defaultConfig)),
    };

    wrapper.history = [newEntry, ...wrapper.history];
    await this.writeWrapper(wrapper);
    return { history: wrapper.history, newId };
  }

  public async toggleFreeze(id: string, isFrozen: boolean): Promise<HistoryEntry[]> {
    const wrapper = await this.getFullWrapper();
    const entry = wrapper.history.find((h: any) => h.id === id);
    if (entry) {
      entry.frozen = isFrozen;
      await this.writeWrapper(wrapper);
    }
    return wrapper.history;
  }

  public async updateEntryDisplay(id: string, newDisplay: string): Promise<HistoryEntry[]> {
    const wrapper = await this.getFullWrapper();
    const entry = wrapper.history.find((h: any) => h.id === id);
    if (entry) {
      entry.display = newDisplay;
      await this.writeWrapper(wrapper);
    }
    return wrapper.history;
  }

  public async removeEntry(id: string): Promise<HistoryEntry[]> {
    const wrapper = await this.getFullWrapper();
    wrapper.history = wrapper.history.filter((h: any) => h.id !== id);

    if (wrapper.config && wrapper.config.repo) {
      wrapper.config.repo.forEach((r: any) => {
        if (r.lastRunConfigId === id) {
          r.lastRunConfigId = 'default';
        }
      });
    }

    await this.writeWrapper(wrapper);
    return wrapper.history;
  }

  public async clearHistory(): Promise<void> {
    const wrapper = await this.getFullWrapper();
    wrapper.history = [];
    if (wrapper.config && wrapper.config.repo) {
      wrapper.config.repo.forEach((r: any) => {
        r.lastRunConfigId = 'default';
      });
    }
    await this.writeWrapper(wrapper);
  }

  public async softClearHistory(): Promise<void> {
    const filePath = this.getHistoryFilePathResolved();
    if (existsSync(filePath)) {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const backupPath = `${filePath}.${timestamp}.del`;
      await fs.copyFile(filePath, backupPath);
    }
  }

  public async clearHistoryWithMode(request: HistoryClearRequest): Promise<HistoryClearResult> {
    let backupPath: string | undefined = undefined;

    if (request.mode === 'remove-selected-soft' || request.mode === 'clear-all-soft') {
      const filePath = this.getHistoryFilePathResolved();
      if (existsSync(filePath)) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        backupPath = `${filePath}.${timestamp}.del`;
        await fs.copyFile(filePath, backupPath);
      }
    }

    if (request.mode === 'remove-selected-hard' || request.mode === 'remove-selected-soft') {
      if (request.selectedId && request.selectedId !== 'default') {
        const history = await this.removeEntry(request.selectedId);
        return { history, selectedId: 'default', backupPath };
      }
    } else if (request.mode === 'clear-all-hard' || request.mode === 'clear-all-soft') {
      await this.clearHistory();
      return { history: [], selectedId: 'default', backupPath };
    }

    const history = await this.loadHistory();
    return { history, selectedId: request.selectedId || 'default', backupPath };
  }

  public async openHistoryFile(): Promise<void> {
    console.log('[FilesExporterHistoryAdapter] openHistoryFile invoked');
    logInfo('[FilesExporterHistoryAdapter] openHistoryFile starting...');
    try {
      const filePath = this.getHistoryFilePathResolved();
      const parentDir = path.dirname(filePath);

      if (!existsSync(parentDir)) {
        await fs.mkdir(parentDir, { recursive: true });
      }

      if (!existsSync(filePath)) {
        await fs.writeFile(filePath, JSON.stringify({ config: { repo: [] }, history: [] }, null, 2), 'utf8');
      }

      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    } catch (err: any) {
      console.error('[FilesExporterHistoryAdapter] Error in openHistoryFile:', err);
      logError('[FilesExporterHistoryAdapter] Error in openHistoryFile:', err);
      throw err;
    }
  }

  public async revealHistoryFile(): Promise<void> {
    console.log('[FilesExporterHistoryAdapter] revealHistoryFile invoked');
    logInfo('[FilesExporterHistoryAdapter] revealHistoryFile starting...');
    try {
      const filePath = this.getHistoryFilePathResolved();
      console.log('[FilesExporterHistoryAdapter] Resolved history file path:', filePath);
      logInfo('[FilesExporterHistoryAdapter] Resolved history file path:', [filePath]);

      const parentDir = path.dirname(filePath);
      if (!existsSync(parentDir)) {
        await fs.mkdir(parentDir, { recursive: true });
        console.log('[FilesExporterHistoryAdapter] Created parent directory:', parentDir);
        logInfo('[FilesExporterHistoryAdapter] Created parent directory:', [parentDir]);
      }

      if (!existsSync(filePath)) {
        await fs.writeFile(filePath, JSON.stringify({ config: { repo: [] }, history: [] }, null, 2), 'utf8');
        console.log('[FilesExporterHistoryAdapter] Created initial history file:', filePath);
        logInfo('[FilesExporterHistoryAdapter] Created initial history file:', [filePath]);
      }

      console.log('[FilesExporterHistoryAdapter] Revealing path in OS explorer:', filePath);
      logInfo('[FilesExporterHistoryAdapter] Revealing path in OS explorer:', [filePath]);
      await this.getVscodeService().revealInOsExplorer(filePath);
    } catch (err: any) {
      console.error('[FilesExporterHistoryAdapter] Error in revealHistoryFile:', err);
      logError('[FilesExporterHistoryAdapter] Error in revealHistoryFile:', err);
      throw err;
    }
  }

  public dispose() {}
}
