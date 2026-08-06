import * as vscode from 'vscode';
import { VsCodeSettings } from '../../../../../shared/services/vscode/domain/model/VsCodeSettings.gen';
import { VsCodeSettingsManager } from '../core/VsCodeSettingsManager';

export function getExtentionSettings(context: vscode.ExtensionContext): VsCodeSettings {
    // Loads resolved, unflattened settings injected directly into VsCodeSettings
    return VsCodeSettingsManager.getSettings();
}
