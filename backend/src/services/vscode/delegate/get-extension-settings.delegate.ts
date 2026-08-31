import * as vscode from 'vscode';
import { VsCodeSettings } from '../../../../../shared/services/vscode/model/VsCodeSettings.gen';
import { vsCodeSettingsManager } from '../../../managers/VsCodeSettings.manager';

export function getExtensionSettings(context: vscode.ExtensionContext): VsCodeSettings {
    // Loads resolved, unflattened settings injected directly into VsCodeSettings
    return vsCodeSettingsManager.getSettings();
}
