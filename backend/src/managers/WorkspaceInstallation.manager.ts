'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { vsCodeSettingsManager } from './VsCodeSettings.manager';
import { getAppVersionFromPackageJson, getWorkspaceExtentionPath } from'../utils/utils-vscode';
import { logError, logInfo } from '../utils/utils-log';
import { ServiceEnum } from '../../../shared/config/service-enum.gen';
import { serviceRegistry } from '../core/ServiceRegistry';
import { IGraphRagInstallerServicePort } from '../../../shared/services/graph-rag-explorer/domain/port-out/installer-service.port';
import { copyFolderRecursiveSync } from '../utils/utils-files';

const VERSION_FILENAME = 'version.txt';

/**
 * Manages script and tools installation, store the latest version of extention in workspace extention folder
 */
export class WorkspaceInstallationManager {
    private static instance: WorkspaceInstallationManager;

    private versionFilePath: string;

    private constructor() {
      this.versionFilePath = path.join (getWorkspaceExtentionPath(), VERSION_FILENAME);
    }

    private isCurrentVersionMatchWorkspaceVersion (context: vscode.ExtensionContext): boolean {
        const currentVersion = getAppVersionFromPackageJson(context);
        const workspaceVersion = this.readWorkspaceExtentionVersion();

        const result = currentVersion === workspaceVersion;
        logInfo(`currentVersion '${currentVersion} is equal to workspaceVersion '${workspaceVersion}' ?? ${result}`)

        return result;
    }

    public readWorkspaceExtentionVersion(): string {
        try {
            if (fs.existsSync(this.versionFilePath)) {
                return fs.readFileSync(this.versionFilePath, 'utf8').trim();
            }
        } catch (error) {
            logError(`Failed to read version file at ${this.versionFilePath}:`, error);
        }
        return '';
    }

    public saveWorkspaceExtentionVersion(context: vscode.ExtensionContext): string {
        const currentVersion = getAppVersionFromPackageJson(context);
        try {
            const dirPath = path.dirname(this.versionFilePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            fs.writeFileSync(this.versionFilePath, currentVersion, 'utf8');
            logInfo(`'save Workspace Extention Version done to '${currentVersion}'`);
            return currentVersion;
        } catch (error) {
            logError(`Failed to save version file at ${this.versionFilePath}:`, error);
            return '';
        }
    }

    public isScriptSyncNeeded (context: vscode.ExtensionContext): boolean {
        logInfo('isScriptSyncNeeded start ...');
        if (vsCodeSettingsManager.getSettings().forceScriptSync === true)
            return true;

        const result = !this.isCurrentVersionMatchWorkspaceVersion (context)
        logInfo(`isScriptSyncNeeded end with result = ${result}...`);
        return result;
    }

    public syncScripts (context: vscode.ExtensionContext): boolean {
        logInfo('Script Sync start ...');
        if (!this.isScriptSyncNeeded(context)) {
            logInfo('Script Sync NOT Needed !!!!');
            return false;
        }

        logInfo('Script Sync needed ...');
        //const gaphRagInstallerService: IGraphRagInstallerServicePort = serviceRegistry.get(ServiceEnum.GRAPH_RAG_INSTALLER);
        this.copyScripts(context);

        logInfo('Script Sync finished.');

        return true;
    }


    public copyScripts(context: vscode.ExtensionContext): void {
        const sourceDir = path.join(context.extensionPath, "scripts");
        const targetDir = path.join(getWorkspaceExtentionPath(), "scripts");

      try {
            logInfo('[GraphRagInstallerAdapter] Syncing scripts directory...', {sourceDir: sourceDir, targetDir:targetDir});
            copyFolderRecursiveSync(sourceDir, targetDir);
            this.saveWorkspaceExtentionVersion(context);
        } catch (err) {
            logError(`[GraphRagInstallerAdapter] Script sync failed: ${err}`, err);
        }

    }

    public installTools(): void {
        // Execute scripts to install tools

    }


    public static getInstance(): WorkspaceInstallationManager {
        if (!WorkspaceInstallationManager.instance) {
            WorkspaceInstallationManager.instance = new WorkspaceInstallationManager();
        }
        return WorkspaceInstallationManager.instance;
    }
}

export const workspaceInstallationManager: WorkspaceInstallationManager = WorkspaceInstallationManager.getInstance();
