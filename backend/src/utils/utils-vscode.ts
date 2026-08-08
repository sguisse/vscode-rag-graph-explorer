import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { vsCodeSettingsManager } from '../managers/VsCodeSettings.manager';
import { currentExtensionContext, currentWebviewPanel } from '../extension';

export function getCurrentExtensionContext(): vscode.ExtensionContext  {
    if (!currentExtensionContext) {
        throw new Error ("currentExtensionContext not yet initialized !!")
    }

    return currentExtensionContext;
}


export function getCurrentWebviewPanel(): vscode.WebviewPanel  {
    if (!currentWebviewPanel) {
        throw new Error ("currentWebviewPanel not yet initialized !!")
    }

    return currentWebviewPanel;
}

export function getWorkspaceRoot(): string {
  const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return '';

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    return workspaceRoot;
}

export function getWorkspaceExtentionPath(): string {
  return path.join(getWorkspaceRoot(), vsCodeSettingsManager.getSettings().backendWorkspacePath);
}

export function getAppNameFromPackageJson(context: vscode.ExtensionContext): string {
    const packageData = context.extension.packageJSON;
    return packageData.name;
}

export function getAppDisplayNameFromPackageJson(context: vscode.ExtensionContext): string {
    const packageData = context.extension.packageJSON;
    return packageData.displayName;
}

export function getAppNormalizedNameFromPackageJson(context: vscode.ExtensionContext): string {
    const packageData = context.extension.packageJSON;
    return toCamelCase(packageData.name);
}

export function getAppVersionFromPackageJson(context: vscode.ExtensionContext): string {
    const packageData = context.extension.packageJSON;
    return packageData.version;
}

function toCamelCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[-_ ]+(.)/g, (_, char: string) => char.toUpperCase());
}
