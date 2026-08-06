import * as vscode from 'vscode';
import { VsCodeSettings } from '../../../../../shared/services/vscode/domain/model/VsCodeSettings';

export function getExtentionSettings(context: vscode.ExtensionContext): VsCodeSettings {

    return new VsCodeSettings();

}
