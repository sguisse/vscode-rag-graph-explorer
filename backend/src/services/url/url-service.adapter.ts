import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logError, logInfo } from '../../utils/utils-log';
import { IReferenceServicePort } from '../../../../shared/services/reference/port-out/reference-service.port';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { getWorkspaceRoot } from '../../utils/utils-vscode';
import { ReferenceItem, REFERENCES_PROJECT_KEY } from '../../../../shared/services/reference/model/reference-model';
import { REFERENCES_CONFIG_FILENAME, REFERENCES_CONFIG_PATH } from '../../config/global-constants';
import { IUrlServicePort } from '../../../../shared/services/url/port-out/url-service.port';

export class UrlServiceAdapter extends AbstractServiceAdapter implements IUrlServicePort, vscode.Disposable {

    constructor() {
        super();
    }

     public async readUrlContent(url: string): Promise<string> {
        try {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                const response = await fetch(url);
                if (response.ok) {
                    const text = await response.text();
                    const sizeKb = Number((Buffer.byteLength(text, 'utf8') / 1024).toFixed(2));
                    return text;
                }
            }
        } catch (error) {
            logError(`[UrlServiceAdapter] Failed to fetch content from URL: ${url}`, error);
        }

        return 'URL cannot be read or is not accessible. Please check the URL and try again.';
    }

    public dispose() {
        // Disposable cleanup if needed
    }
}
