
import * as vscode from 'vscode';
import { LogLevel } from '../../../../../shared/services/vscode/types';
import { logMessage } from '../../../utils/utils-log';

export function logMessageFromRemote(level: LogLevel, message: string, details?: any) {
    logMessage(level, message, details);
}
